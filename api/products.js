import { settings } from '../server/config.js';
import { json, route } from '../server/http.js';
import { listProducts } from '../server/orders.js';

// Live price and per-size stock. Presentation data stays in src/catalog.js.
export const GET = route(async () => json({
  products: await listProducts(),
  deliveryMnt: settings().deliveryFeeMnt,
}));
