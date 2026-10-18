// Meta and TikTok pixels for measuring IG/FB/TikTok ads. Nothing loads until a
// pixel ID is configured and the visitor accepts the cookie banner. No names,
// phones or addresses are ever sent — only product ids, values and order numbers.
const META_ID = import.meta.env.VITE_META_PIXEL_ID || '';
const TIKTOK_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID || '';
const CONSENT_KEY = 'void-consent-v1';

let loaded = false;

function readConsent() {
  try { return localStorage.getItem(CONSENT_KEY) || ''; } catch { return ''; }
}

function writeConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch { /* ignore */ }
}

function loadMeta() {
  /* eslint-disable */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', META_ID);
}

function loadTikTok() {
  /* eslint-disable */
  !function (w, d, t) {
    w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
    ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
    ttq.load = function (e, n) {
      var i = 'https://analytics.tiktok.com/i18n/pixel/events.js'; ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i;
      ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; ttq._o[e] = n || {};
      var o = d.createElement('script'); o.type = 'text/javascript'; o.async = !0; o.src = i + '?sdkid=' + e + '&lib=' + t;
      var a = d.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o, a);
    };
  }(window, document, 'ttq');
  /* eslint-enable */
  window.ttq.load(TIKTOK_ID);
}

function load() {
  if (loaded) return;
  loaded = true;
  if (META_ID) loadMeta();
  if (TIKTOK_ID) loadTikTok();
  pageView();
}

function showBanner() {
  const banner = document.createElement('div');
  banner.className = 'consent-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML = `
    <p>We use cookies to measure our Instagram, Facebook and TikTok ads. No personal details are shared.</p>
    <div>
      <button type="button" data-consent="denied">Decline</button>
      <button type="button" data-consent="granted">Accept</button>
    </div>`;
  banner.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-consent]')?.dataset.consent;
    if (!choice) return;
    writeConsent(choice);
    banner.remove();
    if (choice === 'granted') load();
  });
  document.body.append(banner);
}

export function initPixels() {
  if (!META_ID && !TIKTOK_ID) return;
  const consent = readConsent();
  if (consent === 'granted') load();
  else if (!consent) showBanner();
}

const TIKTOK_EVENTS = { AddToCart: 'AddToCart', ViewContent: 'ViewContent', InitiateCheckout: 'InitiateCheckout', Purchase: 'CompletePayment' };

// track('ViewContent', { ids, value, name }) · track('Purchase', { ids, value, eventId })
export function track(event, { ids = [], value = 0, name = '', eventId } = {}) {
  if (!loaded) {
    if (import.meta.env.DEV) console.debug('[pixel]', event, { ids, value, eventId });
    return;
  }
  if (window.fbq) {
    window.fbq('track', event, {
      content_ids: ids, content_type: 'product', content_name: name || undefined, value, currency: 'MNT', num_items: ids.length,
    }, eventId ? { eventID: eventId } : undefined);
  }
  if (window.ttq) {
    window.ttq.track(TIKTOK_EVENTS[event] || event, {
      contents: ids.map((id) => ({ content_id: id, content_type: 'product' })), value, currency: 'MNT',
    }, eventId ? { event_id: eventId } : undefined);
  }
}

export function pageView() {
  if (!loaded) return;
  window.fbq?.('track', 'PageView');
  window.ttq?.page();
}
