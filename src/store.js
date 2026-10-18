import { catalog, formatMnt, sizeSetFor, slugify } from './catalog.js';

// Shared shop state for the 2D pages, the bag and the 3D scene. Exports are
// live bindings: read them anywhere, change them only through these functions.
const PRODUCT_STORAGE_KEY = 'void-showroom-products-v1';
const BAG_STORAGE_KEY = 'void-bag-v1';

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export function priceValue(price) {
  return Number(String(price ?? '').replace(/[^0-9]/g, ''));
}

function loadLocalProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export const defaultProducts = catalog;
export let customProducts = loadLocalProducts();
export let products = [...defaultProducts, ...customProducts];

// Live price and per-size stock from /api/products. Until it answers (or when it
// is unreachable) sizes come from the catalogue without stock numbers.
export const inventory = new Map();
export let inventoryState = 'loading';
export let deliveryMnt = 0;

export const fit = [];
export const fitSizes = new Map();
export let suggestedSize = '';
export let bodyProfileUsed = false;

const events = new EventTarget();

export function subscribe(listener) {
  const handler = (event) => listener(event.detail);
  events.addEventListener('change', handler);
  return () => events.removeEventListener('change', handler);
}

function notify(type) {
  if (type === 'bag') saveBag();
  events.dispatchEvent(new CustomEvent('change', { detail: { type } }));
}

// --- Products ----------------------------------------------------------------

export function slugFor(product) {
  if (product.slug) return product.slug;
  return `${slugify(product.name)}-${slugify(product.id)}`;
}

export function productById(id) {
  return products.find((product) => product.id === id);
}

export function productBySlug(slug) {
  return products.find((product) => slugFor(product) === slug);
}

export function isSellable(product) {
  if (product.isCustom) return false;
  return inventoryState !== 'ready' || inventory.has(product.id);
}

export function sizesFor(product) {
  return inventory.get(product.id)?.sizes
    ?? sizeSetFor(product.category).map((size) => ({ size, stock: null }));
}

export function stockFor(product, size) {
  return sizesFor(product).find((entry) => entry.size === size)?.stock ?? null;
}

export function isSoldOut(product) {
  return isSellable(product) && sizesFor(product).every((entry) => entry.stock === 0);
}

// Lowest stock left in any size, or null when unknown.
export function lowestStock(product) {
  const counts = sizesFor(product).map((entry) => entry.stock).filter((stock) => stock > 0);
  return counts.length ? Math.min(...counts) : null;
}

export function piecesLeft() {
  if (inventoryState !== 'ready') return null;
  let total = 0;
  inventory.forEach((row) => row.sizes.forEach((entry) => { total += entry.stock; }));
  return total;
}

export async function loadInventory() {
  try {
    const response = await fetch('/api/products', { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    inventory.clear();
    data.products.forEach((row) => inventory.set(row.id, row));
    deliveryMnt = Number(data.deliveryMnt) || 0;
    defaultProducts.forEach((product) => {
      const live = inventory.get(product.id);
      if (live && live.priceMnt !== product.priceMnt) {
        product.priceMnt = live.priceMnt;
        product.price = formatMnt(live.priceMnt);
      }
    });
    inventoryState = 'ready';
  } catch {
    inventoryState = 'offline';
  }
  notify('inventory');
}

// Admin demo products live in this browser only.
export function addCustomProduct(product) {
  const next = [...customProducts, product];
  try {
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  customProducts = next;
  products = [...defaultProducts, ...customProducts];
  notify('products');
  return true;
}

export function removeCustomProduct(id) {
  customProducts = customProducts.filter((item) => item.id !== id);
  try {
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(customProducts));
  } catch {
    // Storage blocked: the removal still applies to this visit.
  }
  products = [...defaultProducts, ...customProducts];
  removeFromBag(id);
  notify('products');
}

// --- Bag -----------------------------------------------------------------------

export function inBag(product) {
  return fit.some((item) => item.id === product.id);
}

export function addToBag(product, size = '') {
  if (!inBag(product)) fit.push(product);
  if (size) fitSizes.set(product.id, size);
  notify('bag');
}

// Adds a whole look; pieces keep a size already chosen, others wait for one.
export function addLook(ids) {
  ids.map(productById).filter(Boolean).forEach((product) => {
    if (!inBag(product)) fit.push(product);
  });
  notify('bag');
}

export function setBagSize(productId, size) {
  if (size) fitSizes.set(productId, size);
  else fitSizes.delete(productId);
  notify('bag');
}

export function removeFromBag(productId) {
  const index = fit.findIndex((product) => product.id === productId);
  if (index !== -1) fit.splice(index, 1);
  fitSizes.delete(productId);
  notify('bag');
}

export function removePurchased(items) {
  items.forEach((item) => {
    const index = fit.findIndex((product) => product.id === item.productId);
    if (index !== -1) fit.splice(index, 1);
    fitSizes.delete(item.productId);
  });
  notify('bag');
}

// What checkout would buy: sellable pieces with a size, at live prices.
export function checkoutLines() {
  return fit
    .filter((product) => isSellable(product) && fitSizes.get(product.id))
    .map((product) => ({
      productId: product.id,
      name: product.name,
      image: product.image,
      size: fitSizes.get(product.id),
      quantity: 1,
      priceMnt: inventory.get(product.id)?.priceMnt ?? product.priceMnt,
    }));
}

function saveBag() {
  try {
    localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(fit.map((product) => ({
      id: product.id,
      size: fitSizes.get(product.id) || '',
    }))));
  } catch {
    // Storage blocked: the bag still works for this visit.
  }
}

function restoreBag() {
  try {
    const saved = JSON.parse(localStorage.getItem(BAG_STORAGE_KEY) || '[]');
    saved.forEach(({ id, size }) => {
      const product = productById(id);
      if (!product || fit.includes(product)) return;
      fit.push(product);
      if (size) fitSizes.set(id, size);
    });
  } catch {
    // Corrupt or blocked storage: start with an empty bag.
  }
}

restoreBag();

// --- Body profile from the try-on ----------------------------------------------

export function setSuggestedSize(size) {
  suggestedSize = size;
}

export function markBodyProfileUsed() {
  bodyProfileUsed = true;
  notify('profile');
}
