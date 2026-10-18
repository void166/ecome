import { CATEGORIES, DROP } from '../catalog.js';
import {
  escapeHtml, isSellable, isSoldOut, lowestStock, piecesLeft, products, slugFor,
} from '../store.js';

export function productBadges(product) {
  if (!isSellable(product)) return '<span class="tag tag-muted">Showroom</span>';
  if (isSoldOut(product)) return '<span class="stamp">Sold out</span>';
  const low = lowestStock(product);
  return low !== null && low <= 3 ? `<span class="tag tag-acid">${low} left</span>` : '';
}

export function productCard(product, { compact = false } = {}) {
  const soldOut = isSoldOut(product);
  return `
    <a class="product-card${soldOut ? ' is-sold-out' : ''}${compact ? ' is-compact' : ''}" href="/p/${escapeHtml(slugFor(product))}">
      <span class="product-card-media">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
        ${productBadges(product)}
      </span>
      <span class="product-card-name">${escapeHtml(product.name)}</span>
      <span class="product-card-meta"><span>${escapeHtml(product.price)}</span><span>${escapeHtml(product.colorName)}</span></span>
    </a>`;
}

export function renderShop(root, { category }) {
  const active = CATEGORIES.some((item) => item.id === category) ? category : '';
  const list = active ? products.filter((product) => product.category === active) : products;
  const left = piecesLeft();
  const label = CATEGORIES.find((item) => item.id === active)?.label;
  document.title = `${label ? `${label} — ` : ''}Shop — VOID/${DROP.code}`;

  root.innerHTML = `
    <header class="page-head">
      <p class="eyebrow"><span></span> Drop ${escapeHtml(DROP.code)} / ${escapeHtml(DROP.title)}</p>
      <h1 class="page-title">${escapeHtml(label || 'Shop all')}</h1>
      <p class="page-sub">${list.length} pieces${left !== null ? ` · <b>${left} left in this drop</b>` : ''}</p>
    </header>
    <nav class="chip-row" aria-label="Categories">
      <a class="chip${active ? '' : ' is-active'}" href="/shop">All</a>
      ${CATEGORIES.map((item) => `<a class="chip${item.id === active ? ' is-active' : ''}" href="/shop/${item.id}">${item.label}</a>`).join('')}
    </nav>
    <section class="product-grid" aria-label="Products">
      ${list.map((product) => productCard(product)).join('') || '<p class="empty-note">Nothing here yet. New pieces drop soon.</p>'}
    </section>`;
}
