import './style.css';
import { createCheckout } from './checkout.js';
import { DROP, LOOKS, CATEGORIES, formatMnt } from './catalog.js';
import { initPixels, pageView, track } from './pixels.js';
import { currentRoute, navigate, startRouter } from './router.js';
import * as store from './store.js';
import { renderProduct, selectSize, selectedSizeFor } from './views/product.js';
import { renderShop } from './views/shop.js';

// Light entry: shop pages, bag and checkout. The three.js showroom (scene.js)
// is only downloaded for the 3D home and the try-on.
const {
  escapeHtml, fit, fitSizes, isSellable, priceValue, sizesFor, stockFor,
} = store;

const page = document.querySelector('#page');
const loader = document.querySelector('#loader');
const fitPanel = document.querySelector('#fit-panel');
const fitItemsElement = document.querySelector('#fit-items');
const openTryonButton = document.querySelector('#open-tryon');

// --- 3D scene (lazy) ------------------------------------------------------------

let scenePromise = null;
let sceneControls = null;

function setLoader(visible, text = 'Building the room') {
  loader.querySelector('small').textContent = text;
  loader.classList.toggle('is-done', !visible);
}

function loadScene(loadingText) {
  if (!scenePromise) {
    setLoader(true, loadingText);
    scenePromise = import('./scene.js').then(({ initScene }) => {
      sceneControls = initScene({
        navigate,
        openBag,
        closeOverlays,
        isOverlayOpen: () => fitPanel.classList.contains('is-open') || checkout.isOpen(),
        onTryonClosed() {
          if (currentRoute()?.name !== 'home') sceneControls.deactivate();
        },
      });
      return sceneControls;
    });
    scenePromise
      .then(() => window.setTimeout(() => setLoader(false), 450))
      .catch(() => {
        scenePromise = null;
        setLoader(false);
      });
  }
  return scenePromise;
}

async function openTryon() {
  if (!fit.length) return;
  closeOverlays();
  const controls = await loadScene('Building the fitting room');
  controls.openTryon();
}

// --- Bag ------------------------------------------------------------------------

function openBag() {
  closeOverlays();
  fitPanel.classList.add('is-open');
  fitPanel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('fit-is-open');
}

function closeBag() {
  fitPanel.classList.remove('is-open');
  fitPanel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('fit-is-open');
}

function closeOverlays() {
  closeBag();
  checkout.close();
}

function updateCheckoutButton() {
  const button = document.querySelector('#fit-checkout');
  const note = document.querySelector('#fit-note');
  const sellable = fit.filter(isSellable);
  const missing = sellable.filter((product) => !fitSizes.get(product.id));
  const soldOut = sellable.filter((product) => stockFor(product, fitSizes.get(product.id)) === 0);
  let message = '';
  if (!fit.length) message = '';
  else if (store.inventoryState === 'offline') message = 'Checkout is offline right now. Try again shortly.';
  else if (!sellable.length) message = 'These showroom pieces are not sold online yet.';
  else if (soldOut.length) message = `${soldOut[0].name} is sold out in ${fitSizes.get(soldOut[0].id)}. Choose another size.`;
  else if (missing.length) message = `Choose a size for ${missing.length === 1 ? missing[0].name : `${missing.length} pieces`}.`;
  else if (sellable.length < fit.length) message = 'Showroom-only pieces stay out of the order.';
  button.disabled = !sellable.length || Boolean(missing.length || soldOut.length) || store.inventoryState !== 'ready';
  note.textContent = message;
}

function renderBag() {
  document.querySelector('#bag-count').textContent = String(fit.length).padStart(2, '0');
  document.querySelector('#fit-total').textContent = formatMnt(fit.reduce((total, product) => total + priceValue(product.price), 0));
  openTryonButton.disabled = fit.length === 0;
  updateCheckoutButton();

  if (!fit.length) {
    fitItemsElement.innerHTML = `
      <div class="fit-empty">
        <span>00</span>
        <strong>Your bag is empty</strong>
        <small>Pick a piece in the shop or shop a whole look in the 3D drop.</small>
        <a class="button-acid" href="/shop">Shop the drop <span>→</span></a>
      </div>`;
    return;
  }

  fitItemsElement.innerHTML = fit.map((product, index) => {
    const id = escapeHtml(product.id);
    const name = escapeHtml(product.name);
    const chosen = fitSizes.get(product.id) || '';
    const sizeControl = isSellable(product)
      ? `<select data-size-for="${id}" aria-label="Size for ${name}" class="${chosen ? '' : 'is-missing'}">
          <option value="">Choose size</option>
          ${sizesFor(product).map(({ size, stock }) => `
            <option value="${escapeHtml(size)}" ${size === chosen ? 'selected' : ''} ${stock === 0 && size !== chosen ? 'disabled' : ''}>
              Size ${escapeHtml(size)}${stock === 0 ? ' — sold out' : ''}
            </option>`).join('')}
        </select>`
      : '<em class="fit-item-flag">Showroom only · try-on</em>';
    return `
    <article class="fit-item" style="--item-accent:${escapeHtml(product.accent)}">
      <span class="fit-item-index">${String(index + 1).padStart(2, '0')}</span>
      <a href="/p/${escapeHtml(store.slugFor(product))}" class="fit-item-image"><img src="${escapeHtml(product.image)}" alt="" /></a>
      <div>
        <small>${id} / ${escapeHtml(product.colorName)}</small>
        <strong>${name}</strong>
        <span>${escapeHtml(product.price)}</span>
        ${sizeControl}
      </div>
      <button type="button" data-remove="${id}" aria-label="Remove ${name}">×</button>
    </article>`;
  }).join('');
}

fitItemsElement.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove]');
  if (removeButton) store.removeFromBag(removeButton.dataset.remove);
  if (event.target.closest('a[href]')) closeBag();
});

fitItemsElement.addEventListener('change', (event) => {
  const select = event.target.closest('[data-size-for]');
  if (select) store.setBagSize(select.dataset.sizeFor, select.value);
});

document.querySelector('.fit-close').addEventListener('click', closeBag);
document.querySelector('.bag-button').addEventListener('click', openBag);
openTryonButton.addEventListener('click', openTryon);

// --- Checkout ---------------------------------------------------------------------

const checkout = createCheckout({
  getLines: store.checkoutLines,
  getDeliveryMnt: () => store.deliveryMnt,
  imageFor: (id) => store.productById(id)?.image,
  onOpen() {
    closeBag();
    sceneControls?.closeTryon();
  },
  onPaid(order) {
    track('Purchase', {
      ids: order.items.map((item) => item.productId),
      value: order.totalMnt,
      eventId: order.number,
    });
    store.removePurchased(order.items);
    store.loadInventory();
  },
  onStockChanged: store.loadInventory,
});

document.querySelector('#fit-checkout').addEventListener('click', () => {
  const lines = store.checkoutLines();
  if (!lines.length) return;
  track('InitiateCheckout', {
    ids: lines.map((line) => line.productId),
    value: lines.reduce((sum, line) => sum + line.priceMnt * line.quantity, 0),
  });
  checkout.open();
});

// --- Pages ------------------------------------------------------------------------

function routeProduct() {
  const route = currentRoute();
  return route?.name === 'product' ? store.productBySlug(route.params.slug) : null;
}

function renderPage(route) {
  if (route.name === 'shop') renderShop(page, route.params);
  else if (route.name === 'product') renderProduct(page, store.productBySlug(route.params.slug));
  else if (route.name === 'notfound') renderProduct(page, null);
}

function addCurrentProduct(product) {
  const size = selectedSizeFor(product);
  store.addToBag(product, isSellable(product) ? size : '');
  track('AddToCart', { ids: [product.id], value: product.priceMnt || priceValue(product.price), name: product.name });
}

page.addEventListener('click', (event) => {
  const product = routeProduct();
  if (!product) return;
  const sizeButton = event.target.closest('[data-size]');
  if (sizeButton && !sizeButton.disabled) {
    selectSize(sizeButton.dataset.size);
    renderPage(currentRoute());
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'need-size') {
    const error = page.querySelector('.size-error');
    error.textContent = 'Choose your size first.';
    page.querySelector('.size-picker').classList.remove('is-shaking');
    void page.querySelector('.size-picker').offsetWidth;
    page.querySelector('.size-picker').classList.add('is-shaking');
  } else if (action === 'add') {
    addCurrentProduct(product);
    window.setTimeout(openBag, 250);
  } else if (action === 'open-bag') {
    openBag();
  } else if (action === 'try-on') {
    if (!store.inBag(product)) addCurrentProduct(product);
    openTryon();
  }
});

// Home overlays rendered from the catalogue: zone bar and the look card.
function renderHome() {
  document.title = `VOID/${DROP.code} — ${DROP.title}`;
  document.querySelector('#zone-bar').innerHTML = ZONES.map((zone, index) => `
    <button type="button" data-zone="${zone.id}" class="${index ? '' : 'is-active'}">
      <small>0${index}</small>${zone.label}
    </button>`).join('');
  renderLook(ZONES[0].id);
}

const ZONES = [{ id: 'all', label: 'All' }, ...CATEGORIES];

function renderLook(zone) {
  const items = (LOOKS[zone] || []).map(store.productById).filter(Boolean);
  const total = items.reduce((sum, product) => sum + priceValue(product.price), 0);
  const card = document.querySelector('#look-card');
  card.dataset.zone = zone;
  card.innerHTML = `
    <div class="look-card-head">
      <span>The look / ${escapeHtml(ZONES.find((item) => item.id === zone)?.label || '')}</span>
      <strong>${formatMnt(total)}</strong>
    </div>
    <div class="look-card-items">
      ${items.map((product) => `
        <a href="/p/${escapeHtml(store.slugFor(product))}" title="${escapeHtml(product.name)}">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
          <span>${escapeHtml(product.name)}</span>
        </a>`).join('')}
    </div>
    <button type="button" class="button-acid" data-shop-look="${escapeHtml(zone)}">Shop the look <span>＋</span></button>`;
  return items;
}

document.querySelector('#zone-bar').addEventListener('click', (event) => {
  const button = event.target.closest('[data-zone]');
  if (!button) return;
  document.querySelectorAll('#zone-bar [data-zone]').forEach((item) => item.classList.toggle('is-active', item === button));
  renderLook(button.dataset.zone);
  sceneControls?.setZone(button.dataset.zone);
});

document.querySelector('#look-card').addEventListener('click', (event) => {
  const zone = event.target.closest('[data-shop-look]')?.dataset.shopLook;
  if (!zone) return;
  const ids = LOOKS[zone] || [];
  store.addLook(ids);
  track('AddToCart', {
    ids,
    value: ids.map(store.productById).filter(Boolean).reduce((sum, product) => sum + priceValue(product.price), 0),
  });
  openBag();
});

// --- Routing ----------------------------------------------------------------------

startRouter((route) => {
  closeOverlays();
  pageView();
  if (route.name === 'home') {
    page.innerHTML = '';
    renderHome();
    loadScene('Building the room').then((controls) => {
      if (currentRoute()?.name === 'home') controls.activate();
    });
    return;
  }
  setLoader(false);
  if (sceneControls && !document.body.classList.contains('tryon-is-open')) sceneControls.deactivate();
  renderPage(route);
  const product = routeProduct();
  if (product) track('ViewContent', { ids: [product.id], value: product.priceMnt || priceValue(product.price), name: product.name });
});

store.subscribe(({ type }) => {
  if (type === 'bag' || type === 'inventory' || type === 'products') renderBag();
  if (type === 'inventory') checkout.refresh();
  const route = currentRoute();
  if (route && route.name !== 'home' && type !== 'profile') renderPage(route);
});

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  closeOverlays();
  sceneControls?.closeTryon();
});

// The admin demo is a local prototype; keep it out of customers' way.
try {
  if (window.location.hash === '#admin') localStorage.setItem('void-admin', '1');
  if (localStorage.getItem('void-admin') === '1') document.body.classList.add('has-admin');
} catch {
  // Storage blocked: no admin button.
}
document.querySelector('.admin-button').addEventListener('click', async () => {
  closeOverlays();
  const controls = await loadScene('Loading admin');
  controls.openAdmin();
});

renderBag();
initPixels();
store.loadInventory().then(() => checkout.resume());
