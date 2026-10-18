import { json, route } from '../server/http.js';
import { listOrdersForAdmin } from '../server/orders.js';

// Paid and pending orders for fulfilment. Requires "Authorization: Bearer <ADMIN_TOKEN>".
export const GET = route(async (request) => json({ orders: await listOrdersForAdmin(request.headers.get('authorization')) }));
