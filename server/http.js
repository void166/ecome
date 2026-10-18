import { ConfigError } from './config.js';

export class HttpError extends Error {
  constructor(status, code, details) {
    super(code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { 'cache-control': 'no-store', ...headers },
  });
}

export async function readJson(request, maxBytes = 16_000) {
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, 'request_too_large');
  try {
    return JSON.parse(text || '{}');
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
}

// Wraps a handler so errors become JSON codes. Never logs request bodies,
// tokens or customer details — only the error class and code.
export function route(handler) {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ error: error.code, ...(error.details ? { details: error.details } : {}) }, error.status);
      }
      if (error instanceof ConfigError) {
        console.error('[config]', error.message);
        return json({ error: 'checkout_unavailable' }, 503);
      }
      console.error('[api]', error?.name || 'Error', error?.code || error?.message?.slice(0, 120));
      return json({ error: 'server_error' }, 500);
    }
  };
}
