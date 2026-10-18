// Showroom catalogue shared by the 3D room (presentation fields) and the database
// seed (price and sizes). Live price and stock always come from /api/products.

export const SIZE_SETS = {
  apparel: ['XS', 'S', 'M', 'L', 'XL'],
  footwear: ['38', '39', '40', '41', '42', '43', '44'],
};

export function sizeSetFor(category) {
  return category === 'accessories' ? SIZE_SETS.footwear : SIZE_SETS.apparel;
}

export const DELIVERY_AREAS = [
  'Баянгол',
  'Баянзүрх',
  'Сонгинохайрхан',
  'Сүхбаатар',
  'Хан-Уул',
  'Чингэлтэй',
  'Налайх',
  'Багануур',
  'Багахангай',
  'Орон нутаг',
];

export const ORDER_LIMITS = { lines: 8, quantity: 3 };

export function formatMnt(amount) {
  return `₮${Number(amount).toLocaleString('en-US')}`;
}

export const CATEGORIES = [
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'accessories', label: 'Footwear' },
];

// The current drop. Set endsAt to an ISO date to show a countdown.
export const DROP = {
  code: '002',
  title: 'Afterdark club',
  endsAt: null,
};

// Shop policy shown on product pages. Leave null to hide a line until it is decided.
export const SHOP_INFO = {
  exchangeDays: null,
};

// One curated outfit per 3D zone, shown on the hero mannequin ("Shop the look").
export const LOOKS = {
  all: ['V/001', 'V/002', 'V/009', 'V/005'],
  outerwear: ['V/001', 'V/002', 'V/009', 'V/005'],
  tops: ['V/007', 'V/012', 'V/010'],
  bottoms: ['V/003', 'V/004', 'V/005'],
  accessories: ['V/011', 'V/008', 'V/009', 'V/010'],
};

export function slugify(text) {
  return String(text).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const entries = [
  {
    id: 'V/001',
    name: 'Night Shift Jacket',
    category: 'outerwear',
    priceMnt: 289000,
    colorName: 'Obsidian',
    accent: '#171b19',
    style: 'puffer-jacket',
    image: '/products/black-jacket.jpg',
    description: 'Structured outer layer with an oversized profile and technical finish.',
  },
  {
    id: 'V/002',
    name: 'Signal Hoodie',
    category: 'tops',
    priceMnt: 189000,
    colorName: 'Sage / Sand',
    accent: '#899d32',
    style: 'heavy-hoodie',
    image: '/products/hoodies.jpg',
    description: 'Heavy cotton hoodie cut loose, finished with a sharp double-layer hood.',
  },
  {
    id: 'V/003',
    name: 'Concrete Tee',
    category: 'tops',
    priceMnt: 89000,
    colorName: 'Black',
    accent: '#d8d0c2',
    style: 'oversized-tee',
    image: '/products/black-tees.jpg',
    description: 'Dense jersey tee with dropped shoulders and a clean architectural drape.',
  },
  {
    id: 'V/004',
    name: 'Static Sweatpant',
    category: 'bottoms',
    priceMnt: 219000,
    colorName: 'Graphite',
    accent: '#2b302e',
    style: 'wide-sweatpant',
    image: '/products/sweatpants.jpg',
    description: 'Heavyweight brushed cotton sweatpant with a relaxed leg and minimal finish.',
  },
  {
    id: 'V/005',
    name: 'Afterdark High',
    category: 'accessories',
    priceMnt: 249000,
    colorName: 'Black / White',
    accent: '#191c1b',
    style: 'high-top',
    image: '/products/sneakers.jpg',
    description: 'Monochrome high-top profile selected for the VOID afterdark uniform.',
  },
  {
    id: 'V/006',
    name: 'Null Zip Layer',
    category: 'outerwear',
    priceMnt: 269000,
    colorName: 'Carbon',
    accent: '#26332f',
    style: 'cropped-shell',
    image: '/products/black-jacket.jpg',
    description: 'A cropped technical shell cut for sharp layering after midnight.',
  },
  {
    id: 'V/007',
    name: 'Ghostline Hoodie',
    category: 'tops',
    priceMnt: 199000,
    colorName: 'Dust / Acid',
    accent: '#73862d',
    style: 'heavy-hoodie',
    image: '/products/hoodies.jpg',
    description: 'Dense loopback cotton with a floating hood and restrained signal detail.',
  },
  {
    id: 'V/008',
    name: 'Division Tee',
    category: 'tops',
    priceMnt: 99000,
    colorName: 'Void Black',
    accent: '#1e211f',
    style: 'oversized-tee',
    image: '/products/black-tees.jpg',
    description: 'Boxy uniform tee with a reinforced neck and long architectural sleeve.',
  },
  {
    id: 'V/009',
    name: 'Transit Cargo',
    category: 'bottoms',
    priceMnt: 239000,
    colorName: 'Ash',
    accent: '#3b413d',
    style: 'cargo-pant',
    image: '/products/sweatpants.jpg',
    description: 'Wide utility trouser with articulated knees and concealed cargo storage.',
  },
  {
    id: 'V/010',
    name: 'Mono Runner',
    category: 'accessories',
    priceMnt: 229000,
    colorName: 'Bone / Black',
    accent: '#d9d2c3',
    style: 'low-runner',
    image: '/products/sneakers.jpg',
    description: 'Low monochrome runner built to finish the daily VOID uniform.',
  },
  {
    id: 'V/011',
    name: 'Signal Vest',
    category: 'outerwear',
    priceMnt: 179000,
    colorName: 'Night Olive',
    accent: '#66752b',
    style: 'utility-vest',
    image: '/products/black-jacket.jpg',
    description: 'Modular sleeveless layer with an engineered shoulder and utility pockets.',
  },
  {
    id: 'V/012',
    name: 'System Pant',
    category: 'bottoms',
    priceMnt: 209000,
    colorName: 'Graphite',
    accent: '#262c29',
    style: 'straight-pant',
    image: '/products/sweatpants.jpg',
    description: 'Straight technical pant designed to move between studio and street.',
  },
];

// `images` (optional) adds gallery photos on the product page; `image` stays the cover.
export const catalog = entries.map((product) => ({
  ...product,
  slug: slugify(product.name),
  price: formatMnt(product.priceMnt),
}));
