# VOID — Darkroom Store

Mobile-first streetwear store with a 3D drop showroom. Built for traffic from Instagram, Facebook and TikTok ads: every product has its own link, the shop pages load without three.js, and the 3D room is the brand moment on the home page.

- `/` — 3D drop: corridor entrance, streetwear room, zones (All / Outerwear / Tops / Bottoms / Footwear), a realistic MakeHuman (CC0) hero mannequin wearing each zone's look, and "Shop the look".
- `/shop`, `/shop/<category>` — fast product grid with sold-out stamps and low-stock tags.
- `/p/<slug>` — product page: sizes with live stock, add to bag, try-on, complete the look.
- Bag, avatar try-on and QPay checkout work from every page.

Code: `src/app.js` (entry, bag, routing), `src/store.js` (catalogue, stock, bag), `src/router.js`, `src/views/`, `src/checkout.js`, `src/pixels.js`, and `src/scene.js` (three.js showroom and try-on, loaded on demand). Catalogue, drop, looks and shop policy live in `src/catalog.js`.

## Run locally

```bash
npm install
npm run dev
```

Open the exact `Local:` URL printed by Vite. If another project is already using port 5173, Vite will automatically choose another port.

## Backend and checkout

Serverless functions in `api/` (Vercel, Web `Request`/`Response` handlers) with shared code in `server/`. `npm run dev` serves them through Vite (`server/dev-api.js`), so no Vercel CLI is needed locally.

- `GET /api/products` — live price and per-size stock (presentation data stays in `src/catalog.js`).
- `POST /api/orders` — validates the customer, reserves stock and opens a QPay invoice. Prices are computed on the server.
- `POST /api/order-status`, `POST /api/order-cancel` — take the order token in the body, never in the URL.
- `/api/qpay-callback` — HMAC-signed notification only; payment is confirmed with QPay `/v2/payment/check` for the exact amount.
- `GET /api/admin-orders` — paid and pending orders, `Authorization: Bearer $ADMIN_TOKEN`.

Unpaid orders hold their stock for `ORDER_TTL_MINUTES` (default 30); expired orders are checked with QPay once more before the stock is released.

Locally, without `DATABASE_URL`, an embedded PGlite database is created in `.data/` and seeded from the catalogue (10 per size), and `PAYMENT_PROVIDER=demo` shows a "Simulate payment" button. Copy `.env.example` to `.env` to change this.

### Deploying to Vercel

1. Add a Postgres database (Vercel Marketplace → Neon, or Supabase) so `DATABASE_URL` is set.
2. Run `DATABASE_URL=... npm run db:setup` once to create tables and seed products (existing prices and stock are never overwritten).
3. Set `PAYMENT_PROVIDER=qpay`, the `QPAY_*` merchant credentials, `PUBLIC_SITE_URL` (https), `CALLBACK_SECRET` and `ADMIN_TOKEN`. Production refuses the demo provider.

Stock and prices are edited in the database for now (`product_sizes.stock`, `products.price_mnt`).

## Ads tracking

Set `VITE_META_PIXEL_ID` and/or `VITE_TIKTOK_PIXEL_ID` (Vercel env, then redeploy). Pixels load only after the visitor accepts the cookie banner and receive PageView, ViewContent, AddToCart, InitiateCheckout and Purchase (event id = order number, value in MNT). No names, phones or addresses are sent. In development without IDs the events are logged to the console.

## Admin demo storage

The admin button is hidden from customers; open the site once with `#admin` in the URL to show it in that browser. This is not access control.

The admin currently stores custom products and optimized image data in browser `localStorage`, so it is a single-device prototype. The GLB control records asset readiness but does not persist the binary model. A production version should move product records to a database and image/GLB uploads to object storage, then protect the admin with authentication.

## Product images

Demo product photos live in `public/products/`. Replace an image and update its `image` field in the `products` array to swap merchandise without creating a GLB. Image sources and licensing notes are recorded in `public/products/SOURCES.md`.

If GLB garments are added later, replace the photo plane inside `buildProducts()` with a `GLTFLoader` model while preserving the enclosing group and `group.userData.product`. Existing hover, filtering, selection, and product drawer behavior will continue to work.

## Product integration

Replace the local `products` array with Shopify, WooCommerce, or another product feed. The scene UI uses stable fields (`id`, `name`, `category`, `price`, `colorName`, `description`) so the data source can change without rewriting the room.
