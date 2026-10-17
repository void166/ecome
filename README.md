# VOID/01 — Darkroom Store

A procedural Three.js fashion showroom prototype for a youth-focused streetwear brand. The room, wardrobe, lighting, display furniture, hover states, collection filters, and holographic 2.5D product displays are generated in code.

The current concept includes:

- a scroll-driven illuminated corridor and cinematic split-door entrance;
- a paged 12-piece showroom with category filters and immersive product inspection;
- a “Your VOID Fit” outfit builder;
- a procedural 3D mannequin whose height, weight, fit preference, outfit and rotation can be changed;
- a local admin demo that publishes uploaded product images into the next showroom display.

## Run locally

```bash
npm install
npm run dev
```

Open the exact `Local:` URL printed by Vite. If another project is already using port 5173, Vite will automatically choose another port.

## Admin demo storage

The admin currently stores custom products and optimized image data in browser `localStorage`, so it is a single-device prototype. The GLB control records asset readiness but does not persist the binary model. A production version should move product records to a database and image/GLB uploads to object storage, then protect the admin with authentication.

## Product images

Demo product photos live in `public/products/`. Replace an image and update its `image` field in the `products` array to swap merchandise without creating a GLB. Image sources and licensing notes are recorded in `public/products/SOURCES.md`.

If GLB garments are added later, replace the photo plane inside `buildProducts()` with a `GLTFLoader` model while preserving the enclosing group and `group.userData.product`. Existing hover, filtering, selection, and product drawer behavior will continue to work.

## Product integration

Replace the local `products` array with Shopify, WooCommerce, or another product feed. The scene UI uses stable fields (`id`, `name`, `category`, `price`, `colorName`, `description`) so the data source can change without rewriting the room.
