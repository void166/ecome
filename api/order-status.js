import { json, readJson, route } from '../server/http.js';
import { orderStatus } from '../server/orders.js';

// The order token travels in the body, never in the URL, so it stays out of access logs.
export const POST = route(async (request) => {
  const { token } = await readJson(request, 512);
  return json({ order: await orderStatus(token) });
});
