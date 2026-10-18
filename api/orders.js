import { json, readJson, route } from '../server/http.js';
import { createOrder } from '../server/orders.js';

// Creates an order, reserves stock and opens a QPay invoice. Price is computed
// on the server from the database; the client only sends product, size, quantity.
export const POST = route(async (request) => json(await createOrder(await readJson(request)), 201));
