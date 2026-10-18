import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DELIVERY_AREAS, ORDER_LIMITS } from '../src/catalog.js';
import { checkoutSettings, settings } from './config.js';
import { db } from './db.js';
import { HttpError } from './http.js';
import { createInvoice, findPayment, validCallbackSignature } from './qpay.js';

const hashToken = (token) => createHash('sha256').update(String(token)).digest('hex');
const RECHECK_MS = 4000;
const LATE_PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;

// --- Validation -------------------------------------------------------------

function text(value, { min = 0, max }) {
  const clean = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().replace(/\s+/g, ' ');
  return clean.length >= min && clean.length <= max ? clean : null;
}

export function normalizePhone(value) {
  const digits = String(value ?? '').replace(/[\s()-]/g, '').replace(/^\+?976(?=\d{8}$)/, '');
  return /^[5-9]\d{7}$/.test(digits) ? digits : null;
}

function parseCustomer(input = {}) {
  const customer = {
    name: text(input.name, { min: 2, max: 60 }),
    phone: normalizePhone(input.phone),
    email: text(input.email, { max: 120 }) ?? '',
    district: DELIVERY_AREAS.includes(input.district) ? input.district : null,
    address: text(input.address, { min: 6, max: 300 }),
    note: text(input.note, { max: 300 }) ?? '',
  };
  const invalid = [];
  if (!customer.name) invalid.push('name');
  if (!customer.phone) invalid.push('phone');
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) invalid.push('email');
  if (!customer.district) invalid.push('district');
  if (!customer.address) invalid.push('address');
  if (invalid.length) throw new HttpError(422, 'invalid_customer', { fields: invalid });
  return customer;
}

function parseItems(input) {
  if (!Array.isArray(input) || !input.length || input.length > ORDER_LIMITS.lines) {
    throw new HttpError(422, 'invalid_items');
  }
  const merged = new Map();
  for (const item of input) {
    const productId = text(item?.productId, { min: 1, max: 40 });
    const size = text(item?.size, { min: 1, max: 8 });
    const quantity = Number(item?.quantity ?? 1);
    if (!productId || !size || !Number.isInteger(quantity) || quantity < 1) throw new HttpError(422, 'invalid_items');
    const key = `${productId}\u0000${size}`;
    const line = merged.get(key) || { productId, size, quantity: 0 };
    line.quantity += quantity;
    if (line.quantity > ORDER_LIMITS.quantity) throw new HttpError(422, 'invalid_items');
    merged.set(key, line);
  }
  return [...merged.values()];
}

// --- Stock and status transitions --------------------------------------------

async function restock(tx, orderId) {
  await tx.query(
    `UPDATE product_sizes ps SET stock = ps.stock + oi.quantity
     FROM order_items oi
     WHERE oi.order_id = $1 AND ps.product_id = oi.product_id AND ps.size = oi.size`,
    [orderId],
  );
}

async function releaseOrder(database, orderId, status) {
  await database.transaction(async (tx) => {
    const { rows } = await tx.query(
      `UPDATE orders SET status = $2 WHERE id = $1 AND status = 'pending' RETURNING id`,
      [orderId, status],
    );
    if (rows.length) await restock(tx, orderId);
  });
}

// A payment that lands after the reservation was released is still accepted,
// but flagged for a person to check stock.
async function markPaid(database, orderId, paymentId) {
  await database.query(
    `UPDATE orders
     SET status = 'paid', payment_id = $2, paid_at = now(), needs_review = (status <> 'pending')
     WHERE id = $1 AND status <> 'paid'`,
    [orderId, paymentId],
  );
}

async function verifyPayment(database, config, order) {
  if (order.payment_provider !== 'qpay' || !order.invoice_id || config.provider !== 'qpay') return false;
  const paymentId = await findPayment(config, { invoiceId: order.invoice_id, totalMnt: order.total_mnt });
  if (!paymentId) return false;
  await markPaid(database, order.id, paymentId);
  return true;
}

// Releases stock held by unpaid orders past their expiry. Each one is checked
// with QPay first so a payment made at the last minute is never lost.
export async function expireStaleOrders(database, config = settings()) {
  const { rows } = await database.query(
    `SELECT id, invoice_id, total_mnt, payment_provider FROM orders
     WHERE status = 'pending' AND expires_at < now() ORDER BY expires_at LIMIT 5`,
  );
  for (const order of rows) {
    try {
      if (await verifyPayment(database, config, order)) continue;
    } catch {
      continue; // QPay unreachable: keep the reservation and try again later.
    }
    await releaseOrder(database, order.id, 'expired');
  }
}

// --- Public shape ------------------------------------------------------------

async function publicOrder(database, order) {
  const { rows: items } = await database.query(
    `SELECT product_id, name, size, quantity, unit_price_mnt FROM order_items WHERE order_id = $1 ORDER BY name`,
    [order.id],
  );
  return {
    number: `VOID-${order.number}`,
    status: order.status,
    subtotalMnt: order.subtotal_mnt,
    deliveryMnt: order.delivery_mnt,
    totalMnt: order.total_mnt,
    expiresAt: new Date(order.expires_at).toISOString(),
    createdAt: new Date(order.created_at).toISOString(),
    customer: { name: order.customer_name, phone: order.phone, district: order.district },
    items: items.map((item) => ({
      productId: item.product_id,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      unitPriceMnt: item.unit_price_mnt,
    })),
    demo: order.payment_provider === 'demo',
    payment: order.status === 'pending' ? order.invoice : null,
  };
}

// --- Use cases ---------------------------------------------------------------

export async function listProducts() {
  const database = await db();
  await expireStaleOrders(database).catch(() => {});
  const { rows } = await database.query(
    `SELECT p.id, p.price_mnt, s.size, s.stock
     FROM products p JOIN product_sizes s ON s.product_id = p.id
     WHERE p.active ORDER BY p.position, s.position`,
  );
  const products = new Map();
  for (const row of rows) {
    const product = products.get(row.id) || { id: row.id, priceMnt: row.price_mnt, sizes: [] };
    product.sizes.push({ size: row.size, stock: row.stock });
    products.set(row.id, product);
  }
  return [...products.values()];
}

export async function createOrder(body) {
  const config = checkoutSettings();
  const customer = parseCustomer(body?.customer);
  const items = parseItems(body?.items);
  const database = await db();
  await expireStaleOrders(database, config).catch(() => {});

  const token = randomBytes(24).toString('base64url');
  const orderId = randomUUID();
  const order = await database.transaction(async (tx) => {
    const lines = [];
    const shortages = [];
    for (const item of items) {
      const { rows: [product] } = await tx.query(
        'SELECT id, name, price_mnt FROM products WHERE id = $1 AND active',
        [item.productId],
      );
      if (!product) throw new HttpError(422, 'unknown_product', { productId: item.productId });
      const { rows: [reserved] } = await tx.query(
        `UPDATE product_sizes SET stock = stock - $3
         WHERE product_id = $1 AND size = $2 AND stock >= $3 RETURNING stock`,
        [item.productId, item.size, item.quantity],
      );
      if (!reserved) {
        const { rows: [left] } = await tx.query(
          'SELECT stock FROM product_sizes WHERE product_id = $1 AND size = $2',
          [item.productId, item.size],
        );
        shortages.push({ productId: item.productId, size: item.size, available: left?.stock ?? 0 });
      }
      lines.push({ ...item, name: product.name, unitPriceMnt: product.price_mnt });
    }
    if (shortages.length) throw new HttpError(409, 'out_of_stock', { items: shortages });

    const subtotal = lines.reduce((sum, line) => sum + line.unitPriceMnt * line.quantity, 0);
    const delivery = config.deliveryFeeMnt;
    const { rows: [created] } = await tx.query(
      `INSERT INTO orders (id, token_hash, customer_name, phone, email, district, address, note,
         subtotal_mnt, delivery_mnt, total_mnt, payment_provider, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now() + make_interval(mins => $13))
       RETURNING *`,
      [orderId, hashToken(token), customer.name, customer.phone, customer.email, customer.district,
        customer.address, customer.note, subtotal, delivery, subtotal + delivery, config.provider,
        config.orderTtlMinutes],
    );
    for (const line of lines) {
      await tx.query(
        `INSERT INTO order_items (order_id, product_id, name, size, quantity, unit_price_mnt)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, line.productId, line.name, line.size, line.quantity, line.unitPriceMnt],
      );
    }
    return created;
  });

  let invoice;
  try {
    invoice = config.provider === 'qpay'
      ? await createInvoice(config, { number: order.number, totalMnt: order.total_mnt })
      : { id: `demo-${order.number}`, qrImage: null, qrText: null, shortUrl: null, links: [] };
  } catch (error) {
    await releaseOrder(database, orderId, 'cancelled');
    throw error;
  }
  const { rows: [saved] } = await database.query(
    'UPDATE orders SET invoice_id = $2, invoice = $3::jsonb WHERE id = $1 RETURNING *',
    [orderId, invoice.id, JSON.stringify(invoice)],
  );
  return { token, order: await publicOrder(database, saved) };
}

async function orderByToken(database, token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 64) throw new HttpError(404, 'order_not_found');
  const { rows: [order] } = await database.query('SELECT * FROM orders WHERE token_hash = $1', [hashToken(token)]);
  if (!order) throw new HttpError(404, 'order_not_found');
  return order;
}

export async function orderStatus(token) {
  const config = settings();
  const database = await db();
  let order = await orderByToken(database, token);
  const lastCheck = order.checked_at ? new Date(order.checked_at).getTime() : 0;
  const recent = Date.now() - new Date(order.created_at).getTime() < LATE_PAYMENT_WINDOW_MS;
  if ((order.status === 'pending' || (order.status === 'expired' && recent)) && Date.now() - lastCheck > RECHECK_MS) {
    await database.query('UPDATE orders SET checked_at = now() WHERE id = $1', [order.id]);
    let paid = null;
    try {
      paid = await verifyPayment(database, config, order);
    } catch {
      // QPay unreachable: keep the reservation, report the stored status; the client polls again.
    }
    if (paid === false && order.status === 'pending' && new Date(order.expires_at).getTime() < Date.now()) {
      await releaseOrder(database, order.id, 'expired');
    }
    order = await orderByToken(database, token);
  }
  return publicOrder(database, order);
}

// QPay callback: a notification only. Payment is confirmed with /payment/check.
export async function handleQpayCallback(number, signature) {
  const config = checkoutSettings();
  if (config.provider !== 'qpay' || !/^\d{1,10}$/.test(String(number))
    || !validCallbackSignature(config, number, signature)) {
    throw new HttpError(403, 'invalid_callback');
  }
  const database = await db();
  const { rows: [order] } = await database.query('SELECT * FROM orders WHERE number = $1', [Number(number)]);
  if (order && order.status !== 'paid') await verifyPayment(database, config, order);
}

// Customer backs out of the payment step: release the stock unless QPay already
// has the money.
export async function cancelOrder(token) {
  const config = settings();
  const database = await db();
  const order = await orderByToken(database, token);
  if (order.status === 'pending') {
    let paid = null;
    try {
      paid = await verifyPayment(database, config, order);
    } catch {
      throw new HttpError(502, 'payment_provider_unavailable');
    }
    if (!paid) await releaseOrder(database, order.id, 'cancelled');
  }
  return publicOrder(database, await orderByToken(database, token));
}

// Demo provider only (never in production): lets local checkout reach "paid".
export async function simulatePayment(token) {
  const config = checkoutSettings();
  if (config.provider !== 'demo') throw new HttpError(404, 'not_found');
  const database = await db();
  const order = await orderByToken(database, token);
  if (order.status !== 'pending') throw new HttpError(409, 'order_not_pending');
  await markPaid(database, order.id, `demo-${randomUUID()}`);
  return publicOrder(database, await orderByToken(database, token));
}

export async function listOrdersForAdmin(authorization) {
  const { adminToken } = settings();
  const given = String(authorization || '').replace(/^Bearer\s+/i, '');
  if (adminToken.length < 16 || hashToken(given) !== hashToken(adminToken)) throw new HttpError(401, 'unauthorized');
  const database = await db();
  const { rows } = await database.query(
    `SELECT o.number, o.status, o.customer_name, o.phone, o.email, o.district, o.address, o.note,
       o.total_mnt, o.needs_review, o.created_at, o.paid_at,
       COALESCE(json_agg(json_build_object('productId', i.product_id, 'name', i.name, 'size', i.size,
         'quantity', i.quantity)) FILTER (WHERE i.order_id IS NOT NULL), '[]') AS items
     FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
     WHERE o.status IN ('paid', 'pending')
     GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200`,
  );
  return rows.map((row) => ({ ...row, number: `VOID-${row.number}` }));
}
