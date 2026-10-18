import { CATEGORIES, DROP, SHOP_INFO, formatMnt } from '../catalog.js';
import {
  bodyProfileUsed, deliveryMnt, escapeHtml, fitSizes, inBag, isSellable, products, sizesFor, stockFor,
  suggestedSize,
} from '../store.js';
import { productCard } from './shop.js';

// Size state for the product on screen; survives re-renders after stock refreshes.
let currentId = '';
let selectedSize = '';

export function selectedSizeFor(product) {
  if (product.id !== currentId) {
    currentId = product.id;
    selectedSize = fitSizes.get(product.id) || '';
  }
  return selectedSize;
}

export function selectSize(size) {
  selectedSize = size;
}

function completeTheLook(product) {
  return CATEGORIES
    .filter((category) => category.id !== product.category)
    .map((category) => products.find((item) => item.category === category.id && !item.isCustom))
    .filter(Boolean);
}

function addButtonState(product, size) {
  const sellable = isSellable(product);
  const sizes = sizesFor(product);
  const soldOut = sellable && sizes.every((entry) => entry.stock === 0);
  const bagged = inBag(product);
  const sameSize = !sellable || fitSizes.get(product.id) === size;
  if (bagged && sameSize) return { label: 'In your bag — view', action: 'open-bag', disabled: false };
  if (bagged) return { label: `Update size · ${size}`, action: 'add', disabled: false };
  if (soldOut) return { label: 'Sold out', action: '', disabled: true };
  if (!sellable) return { label: 'Add to fit for try-on', action: 'add', disabled: false };
  if (!size) return { label: 'Select a size', action: 'need-size', disabled: false };
  return { label: `Add to bag · ${size}`, action: 'add', disabled: false };
}

function sizeHint(product, size, recommended) {
  if (!isSellable(product)) return 'Showroom piece — not sold online yet';
  const sizes = sizesFor(product);
  if (sizes.every((entry) => entry.stock === 0)) return 'Sold out in every size';
  const stock = stockFor(product, size);
  if (stock > 0 && stock <= 3) return `Only ${stock} left in ${size}`;
  if (recommended) return `Suggested for your profile: ${recommended}`;
  return product.category === 'accessories' ? 'EU sizes' : '';
}

export function renderProduct(root, product) {
  if (!product) {
    document.title = 'Not found — VOID';
    root.innerHTML = `
      <section class="not-found">
        <p class="eyebrow"><span></span> 404</p>
        <h1 class="page-title">Gone<br />after dark.</h1>
        <p class="page-sub">This piece is not in the drop anymore.</p>
        <a class="button-acid" href="/shop">Shop the drop <span>→</span></a>
      </section>`;
    return;
  }
  const size = selectedSizeFor(product);
  const sellable = isSellable(product);
  const sizes = sizesFor(product);
  const recommended = bodyProfileUsed && product.category !== 'accessories' ? suggestedSize : '';
  const images = product.images?.length ? product.images : [product.image];
  const button = addButtonState(product, size);
  const category = CATEGORIES.find((item) => item.id === product.category);
  document.title = `${product.name} — VOID/${DROP.code}`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', product.description);

  root.innerHTML = `
    <article class="product-page" data-product="${escapeHtml(product.id)}">
      <div class="product-gallery">
        <div class="gallery-track">
          ${images.map((src, index) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(product.name)}${images.length > 1 ? ` — photo ${index + 1}` : ''}" ${index ? 'loading="lazy"' : ''} />`).join('')}
        </div>
        <span class="gallery-code">${escapeHtml(product.id)} / Drop ${escapeHtml(DROP.code)}</span>
        <button class="gallery-tryon" type="button" data-action="try-on">Try on <span>◎</span></button>
        ${images.length > 1 ? `<span class="gallery-dots">${images.map((_, index) => `<i class="${index ? '' : 'is-active'}"></i>`).join('')}</span>` : ''}
      </div>

      <div class="product-info">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/shop">Shop</a> / <a href="/shop/${escapeHtml(product.category)}">${escapeHtml(category?.label || product.category)}</a></nav>
        <h1 class="product-title">${escapeHtml(product.name)}</h1>
        <p class="product-price">${escapeHtml(product.price)}</p>
        <p class="product-desc">${escapeHtml(product.description)}</p>
        <dl class="product-facts">
          <div><dt>Color</dt><dd>${escapeHtml(product.colorName)}</dd></div>
          <div><dt>Category</dt><dd>${escapeHtml(category?.label || product.category)}</dd></div>
          <div><dt>Drop</dt><dd>${escapeHtml(DROP.code)}</dd></div>
        </dl>

        <div class="size-picker${sellable ? '' : ' is-unavailable'}">
          <div class="size-picker-head">
            <small id="size-picker-label">Size</small>
            <span aria-live="polite">${escapeHtml(sizeHint(product, size, recommended))}</span>
          </div>
          <div class="size-options" role="radiogroup" aria-labelledby="size-picker-label">
            ${sizes.map(({ size: option, stock }) => `
              <button type="button" role="radio" aria-checked="${option === size}" data-size="${escapeHtml(option)}"
                class="${option === recommended ? 'is-recommended' : ''}" ${stock === 0 || !sellable ? 'disabled' : ''}
                aria-label="Size ${escapeHtml(option)}${stock === 0 ? ', sold out' : ''}${option === recommended ? ', suggested for you' : ''}">${escapeHtml(option)}</button>`).join('')}
          </div>
          <p class="size-error" role="alert"></p>
        </div>

        <ul class="trust-row">
          <li><span>◇</span> ${deliveryMnt ? `Delivery ${formatMnt(deliveryMnt)}` : 'Free delivery'} · Ulaanbaatar</li>
          <li><span>◇</span> Pay with QPay or any bank app</li>
          ${SHOP_INFO.exchangeDays ? `<li><span>◇</span> ${SHOP_INFO.exchangeDays}-day size exchange</li>` : ''}
        </ul>

        <div class="buy-bar">
          <div class="buy-bar-price"><small>${escapeHtml(product.name)}</small><strong>${escapeHtml(product.price)}</strong></div>
          <button class="button-acid" type="button" data-action="${button.action}" ${button.disabled ? 'disabled' : ''}>${escapeHtml(button.label)} <span>${button.action === 'open-bag' ? '→' : '＋'}</span></button>
        </div>
      </div>
    </article>

    <section class="look-strip">
      <header><p class="eyebrow"><span></span> Complete the look</p></header>
      <div class="look-strip-row">${completeTheLook(product).map((item) => productCard(item, { compact: true })).join('')}</div>
    </section>`;
}
