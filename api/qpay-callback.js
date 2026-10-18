import { route } from '../server/http.js';
import { handleQpayCallback } from '../server/orders.js';

async function callback(request) {
  const url = new URL(request.url);
  await handleQpayCallback(url.searchParams.get('order'), url.searchParams.get('sig'));
  return new Response('SUCCESS', { headers: { 'content-type': 'text/plain' } });
}

export const GET = route(callback);
export const POST = route(callback);
