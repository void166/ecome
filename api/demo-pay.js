import { json, readJson, route } from '../server/http.js';
import { simulatePayment } from '../server/orders.js';

// Local/preview only: refuses unless PAYMENT_PROVIDER=demo outside production.
export const POST = route(async (request) => {
  const { token } = await readJson(request, 512);
  return json({ order: await simulatePayment(token) });
});
