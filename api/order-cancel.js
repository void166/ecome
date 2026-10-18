import { json, readJson, route } from '../server/http.js';
import { cancelOrder } from '../server/orders.js';

export const POST = route(async (request) => {
  const { token } = await readJson(request, 512);
  return json({ order: await cancelOrder(token) });
});
