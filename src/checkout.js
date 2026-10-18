import { DELIVERY_AREAS, formatMnt } from './catalog.js';

// Checkout panel: delivery form → QPay invoice → paid. The order token is a
// capability; it lives only in this browser so a customer who leaves for their
// bank app can come back to the same payment screen.
const PENDING_KEY = 'void-pending-order-v1';
const POLL_MS = 5000;

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const storage = {
  get() {
    try { return localStorage.getItem(PENDING_KEY) || ''; } catch { return ''; }
  },
  set(token) {
    try { localStorage.setItem(PENDING_KEY, token); } catch { /* private mode: resume is best effort */ }
  },
  clear() {
    try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
  },
};

class ApiError extends Error {
  constructor(code, details) {
    super(code);
    this.code = code;
    this.details = details;
  }
}

async function api(path, body) {
  let response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('network');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || 'server_error', data.details);
  return data;
}

const MESSAGES = {
  network: 'Connection problem. Check your internet and try again.',
  invalid_customer: 'Please check the highlighted fields.',
  invalid_items: 'Something in your bag changed. Refresh the page and try again.',
  unknown_product: 'A piece in your bag is no longer sold online. Remove it and try again.',
  checkout_unavailable: 'Checkout is temporarily unavailable. Please try again later.',
  payment_provider_unavailable: 'QPay is not responding. Please try again in a minute.',
  invalid_invoice_response: 'QPay is not responding. Please try again in a minute.',
  order_not_found: 'This order could not be found.',
};

export function createCheckout({ getLines, getDeliveryMnt, imageFor, onOpen, onPaid, onStockChanged }) {
  const panel = document.querySelector('#checkout-panel');
  const form = document.querySelector('#checkout-form');
  const payment = document.querySelector('#checkout-payment');
  const done = document.querySelector('#checkout-done');
  const stepLabel = document.querySelector('#checkout-step');
  const errorElement = document.querySelector('#checkout-error');
  const submitButton = document.querySelector('#checkout-submit');
  const statusElement = document.querySelector('#payment-status');
  const checkButton = document.querySelector('#payment-check');
  const demoButton = document.querySelector('#payment-demo');
  const cancelButton = document.querySelector('#payment-cancel');
  const coarsePointer = window.matchMedia('(pointer: coarse)');

  let token = storage.get();
  let order = null;
  let pollTimer = 0;
  let countdownTimer = 0;
  let checking = false;

  document.querySelector('#checkout-district').insertAdjacentHTML(
    'beforeend',
    DELIVERY_AREAS.map((area) => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`).join(''),
  );

  const isOpen = () => panel.classList.contains('is-open');

  function showStep(step) {
    form.hidden = step !== 'form';
    payment.hidden = step !== 'payment';
    done.hidden = step !== 'done';
    stepLabel.textContent = { form: 'Step 01 / Delivery', payment: 'Step 02 / Pay with QPay', done: 'Step 03 / Confirmed' }[step];
    panel.dataset.step = step;
    if (step !== 'payment') stopTimers();
  }

  function linesMarkup(lines) {
    return lines.map((line) => `
      <article class="checkout-line">
        ${line.image ? `<img src="${escapeHtml(line.image)}" alt="" />` : '<span class="checkout-line-swatch"></span>'}
        <div>
          <strong>${escapeHtml(line.name)}</strong>
          <small>Size ${escapeHtml(line.size)}${line.quantity > 1 ? ` · × ${line.quantity}` : ''}</small>
        </div>
        <span>${formatMnt(line.priceMnt * line.quantity)}</span>
      </article>`).join('');
  }

  function renderForm() {
    const lines = getLines();
    const subtotal = lines.reduce((sum, line) => sum + line.priceMnt * line.quantity, 0);
    const delivery = getDeliveryMnt();
    document.querySelector('#checkout-lines').innerHTML = linesMarkup(lines);
    document.querySelector('#checkout-subtotal').textContent = formatMnt(subtotal);
    document.querySelector('#checkout-delivery').textContent = delivery ? formatMnt(delivery) : 'Free';
    document.querySelector('#checkout-total').textContent = formatMnt(subtotal + delivery);
    submitButton.disabled = !lines.length;
  }

  function setError(message) {
    errorElement.textContent = message || '';
  }

  function markFields(names = []) {
    form.querySelectorAll('.field').forEach((field) => {
      const input = field.querySelector('input, select, textarea');
      const invalid = names.includes(input.name);
      field.classList.toggle('is-invalid', invalid);
      input.setAttribute('aria-invalid', String(invalid));
    });
    form.querySelector('.is-invalid input, .is-invalid select, .is-invalid textarea')?.focus();
  }

  function readCustomer() {
    const data = Object.fromEntries(new FormData(form));
    const invalid = [];
    if ((data.name || '').trim().length < 2) invalid.push('name');
    if (!/^(\+?976)?[5-9]\d{7}$/.test((data.phone || '').replace(/[\s()-]/g, ''))) invalid.push('phone');
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) invalid.push('email');
    if (!data.district) invalid.push('district');
    if ((data.address || '').trim().length < 6) invalid.push('address');
    return { data, invalid };
  }

  function stopTimers() {
    window.clearInterval(pollTimer);
    window.clearInterval(countdownTimer);
    pollTimer = 0;
    countdownTimer = 0;
  }

  function renderCountdown() {
    if (!order) return;
    const left = Math.max(0, new Date(order.expiresAt).getTime() - Date.now());
    const minutes = Math.floor(left / 60000);
    const seconds = Math.floor((left % 60000) / 1000);
    document.querySelector('#payment-timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (left === 0) checkStatus();
  }

  function renderPayment() {
    const invoice = order.payment || {};
    document.querySelector('#payment-number').textContent = order.number;
    document.querySelector('#payment-amount').textContent = formatMnt(order.totalMnt);
    const qr = document.querySelector('#payment-qr');
    qr.hidden = !invoice.qrImage;
    if (invoice.qrImage) qr.src = `data:image/png;base64,${invoice.qrImage}`;
    const links = invoice.links || [];
    document.querySelector('#payment-banks').innerHTML = links.map((bank) => `
      <a href="${escapeHtml(bank.link)}" rel="noopener">
        ${bank.logo ? `<img src="${escapeHtml(bank.logo)}" alt="" loading="lazy" />` : ''}
        <span>${escapeHtml(bank.name)}</span>
      </a>`).join('');
    document.querySelector('#payment-copy').textContent = order.demo
      ? 'Demo mode: no real payment is taken. Use the button below to simulate a QPay payment.'
      : coarsePointer.matches
        ? 'Tap your bank app below to pay, then come back to this page.'
        : 'Scan the QR code with any Mongolian bank app or QPay wallet.';
    payment.classList.toggle('is-touch', coarsePointer.matches);
    demoButton.hidden = !order.demo;
    statusElement.innerHTML = '<span></span> Waiting for payment';
    statusElement.classList.remove('is-error');
    showStep('payment');
    stopTimers();
    renderCountdown();
    countdownTimer = window.setInterval(renderCountdown, 1000);
    pollTimer = window.setInterval(checkStatus, POLL_MS);
  }

  function renderDone() {
    stopTimers();
    document.querySelector('#done-title').textContent = 'Payment received';
    document.querySelector('#done-copy').innerHTML = `Order <b>${escapeHtml(order.number)}</b> is confirmed. We will call
      <b>${escapeHtml(order.customer.phone)}</b> to arrange delivery to ${escapeHtml(order.customer.district)}.`;
    document.querySelector('#done-lines').innerHTML = linesMarkup(order.items.map((item) => ({
      name: item.name, size: item.size, quantity: item.quantity, priceMnt: item.unitPriceMnt, image: imageFor?.(item.productId),
    })));
    showStep('done');
  }

  // Applies a fresh order from the server and moves the panel to match.
  function applyOrder(next) {
    order = next;
    if (order.status === 'paid') {
      storage.clear();
      token = '';
      renderDone();
      onPaid?.(order);
    } else if (order.status === 'pending') {
      if (!isOpen() || panel.dataset.step !== 'payment') renderPayment();
    } else {
      storage.clear();
      token = '';
      order = null;
      renderForm();
      showStep('form');
      setError(next.status === 'expired'
        ? 'The payment window expired and the pieces were released. Submit again for a new QR code.'
        : 'That payment was cancelled. Your bag is still here.');
      onStockChanged?.();
    }
  }

  async function checkStatus() {
    if (!token || checking) return;
    checking = true;
    try {
      const { order: next } = await api('/api/order-status', { token });
      if (next.status !== 'pending' || !order) applyOrder(next);
      statusElement.classList.remove('is-error');
    } catch (error) {
      if (error.code === 'order_not_found') {
        storage.clear();
        token = '';
        order = null;
        renderForm();
        showStep('form');
      } else if (isOpen()) {
        statusElement.innerHTML = '<span></span> Connection problem — retrying';
        statusElement.classList.add('is-error');
      }
    } finally {
      checking = false;
    }
  }

  function open() {
    onOpen?.();
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('checkout-is-open');
    if (order?.status === 'paid') {
      renderDone();
    } else if (token && order) {
      renderPayment();
      checkStatus();
    } else {
      setError('');
      renderForm();
      showStep('form');
      window.setTimeout(() => form.querySelector('input[name="name"]').focus({ preventScroll: true }), 420);
    }
  }

  function close() {
    stopTimers();
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('checkout-is-open');
    if (order?.status === 'paid') order = null;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('');
    const { data, invalid } = readCustomer();
    markFields(invalid);
    if (invalid.length) {
      setError(MESSAGES.invalid_customer);
      return;
    }
    const lines = getLines();
    if (!lines.length) return;
    submitButton.disabled = true;
    submitButton.innerHTML = 'Creating QPay invoice <span>…</span>';
    try {
      const result = await api('/api/orders', {
        customer: data,
        items: lines.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
      });
      token = result.token;
      storage.set(token);
      order = result.order;
      renderPayment();
    } catch (error) {
      if (error.code === 'invalid_customer') markFields(error.details?.fields);
      if (error.code === 'out_of_stock') {
        const names = new Map(lines.map((line) => [`${line.productId}/${line.size}`, line.name]));
        const list = (error.details?.items || [])
          .map((item) => `${names.get(`${item.productId}/${item.size}`) || item.productId} (${item.size})`)
          .join(', ');
        setError(`Just sold out: ${list}. Pick another size in your fit.`);
        onStockChanged?.();
      } else {
        setError(MESSAGES[error.code] || 'Something went wrong. Please try again.');
      }
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Pay with QPay <span>↗</span>';
    }
  });

  form.addEventListener('input', (event) => {
    const field = event.target.closest('.field');
    if (field?.classList.contains('is-invalid')) {
      field.classList.remove('is-invalid');
      event.target.setAttribute('aria-invalid', 'false');
    }
  });

  checkButton.addEventListener('click', async () => {
    checkButton.disabled = true;
    statusElement.innerHTML = '<span></span> Checking with QPay';
    await checkStatus();
    if (order?.status === 'pending') statusElement.innerHTML = '<span></span> Not paid yet — waiting for payment';
    window.setTimeout(() => { checkButton.disabled = false; }, 2500);
  });

  demoButton.addEventListener('click', async () => {
    try {
      const { order: paid } = await api('/api/demo-pay', { token });
      applyOrder(paid);
    } catch (error) {
      statusElement.textContent = MESSAGES[error.code] || 'Demo payment failed.';
    }
  });

  cancelButton.addEventListener('click', async () => {
    if (!token) {
      showStep('form');
      return;
    }
    cancelButton.disabled = true;
    try {
      const { order: next } = await api('/api/order-cancel', { token });
      if (next.status === 'paid') {
        applyOrder(next);
      } else {
        storage.clear();
        token = '';
        order = null;
        renderForm();
        showStep('form');
        setError('');
        onStockChanged?.();
      }
    } catch (error) {
      statusElement.textContent = MESSAGES[error.code] || 'Could not cancel. Please try again.';
    } finally {
      cancelButton.disabled = false;
    }
  });

  document.querySelector('.checkout-close').addEventListener('click', close);
  document.querySelector('#done-continue').addEventListener('click', close);

  // Coming back from a bank app: check straight away instead of waiting for the poll.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && token) checkStatus();
  });

  // A payment left open in an earlier visit: pick it up where it stopped.
  async function resume() {
    if (!token) return;
    try {
      const { order: next } = await api('/api/order-status', { token });
      if (next.status === 'pending' || next.status === 'paid') {
        order = next;
        open();
        if (next.status === 'paid') {
          storage.clear();
          token = '';
          onPaid?.(next);
        }
      } else {
        storage.clear();
        token = '';
      }
    } catch (error) {
      if (error.code === 'order_not_found') storage.clear();
    }
  }

  return { open, close, isOpen, resume, refresh: () => { if (panel.dataset.step === 'form') renderForm(); } };
}
