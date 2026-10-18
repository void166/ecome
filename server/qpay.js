import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './http.js';

// QPay merchant API v2. Ported from the BOO! Studio adapter: callbacks are only
// notifications; payment is proven by /v2/payment/check with the exact amount.
const tokenCache = globalThis.__voidQpayToken || (globalThis.__voidQpayToken = { value: '', expiresAt: 0 });

export function callbackSignature(config, orderNumber) {
  return createHmac('sha256', config.callbackSecret).update(String(orderNumber)).digest('hex');
}

export function validCallbackSignature(config, orderNumber, signature) {
  const expected = Buffer.from(callbackSignature(config, orderNumber));
  const given = Buffer.from(String(signature || ''));
  return expected.length === given.length && timingSafeEqual(expected, given);
}

async function request(config, path, init) {
  const response = await fetch(`${config.qpay.baseUrl}${path}`, {
    ...init,
    signal: AbortSignal.timeout(20_000),
  });
  return response;
}

async function token(config) {
  if (Date.now() < tokenCache.expiresAt) return tokenCache.value;
  const basic = Buffer.from(`${config.qpay.clientId}:${config.qpay.clientSecret}`).toString('base64');
  const response = await request(config, '/v2/auth/token', {
    method: 'POST',
    headers: { authorization: `Basic ${basic}` },
  });
  if (!response.ok) throw new HttpError(502, 'payment_provider_unavailable');
  const data = await response.json();
  const expiry = Number(data.expires_in || 300);
  // QPay has returned both "seconds from now" and an absolute epoch here.
  const expiresAtSeconds = expiry > 1_000_000_000 ? expiry : Date.now() / 1000 + expiry;
  tokenCache.value = data.access_token;
  tokenCache.expiresAt = (expiresAtSeconds - 60) * 1000;
  return tokenCache.value;
}

async function post(config, path, payload) {
  try {
    const send = async () => request(config, path, {
      method: 'POST',
      headers: { authorization: `Bearer ${await token(config)}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let response = await send();
    if (response.status === 401) {
      tokenCache.expiresAt = 0;
      response = await send();
    }
    if (!response.ok) throw new HttpError(502, 'payment_provider_unavailable');
    return await response.json();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, 'payment_provider_unavailable');
  }
}

export async function createInvoice(config, order) {
  const callbackUrl = `${config.publicSiteUrl}/api/qpay-callback?order=${order.number}&sig=${callbackSignature(config, order.number)}`;
  const result = await post(config, '/v2/invoice', {
    invoice_code: config.qpay.invoiceCode,
    sender_invoice_no: `VOID-${order.number}`,
    invoice_receiver_code: config.qpay.receiverCode,
    invoice_description: `VOID/01 order ${order.number}`,
    amount: order.totalMnt,
    callback_url: callbackUrl,
  });
  if (!result.invoice_id) throw new HttpError(502, 'invalid_invoice_response');
  return {
    id: String(result.invoice_id),
    qrImage: result.qr_image || null,
    qrText: result.qr_text || null,
    shortUrl: result.qPay_shortUrl || null,
    links: (result.urls || [])
      .filter((row) => typeof row.link === 'string' && row.link && !/^\s*(javascript|data|vbscript):/i.test(row.link))
      .map((row) => ({ name: row.description || row.name || 'Bank', logo: row.logo || '', link: row.link })),
  };
}

// Returns the QPay payment id when a PAID MNT payment of exactly the order total exists.
export async function findPayment(config, order) {
  const result = await post(config, '/v2/payment/check', {
    object_type: 'INVOICE',
    object_id: order.invoiceId,
    offset: { page_number: 1, page_limit: 100 },
  });
  for (const row of result.rows || []) {
    if (
      row.payment_status === 'PAID'
      && row.payment_currency === 'MNT'
      && Number(row.payment_amount) === Number(order.totalMnt)
      && row.payment_id
    ) return String(row.payment_id);
  }
  return null;
}
