import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Serves api/*.js through the Vite dev server with the same Web Request/Response
// handlers that Vercel runs in production, so `npm run dev` needs no Vercel CLI.
export function devApi() {
  return {
    name: 'void-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = req.url.match(/^\/api\/([a-z0-9-]+)(?:\?|$)/);
        const file = match && resolve(server.config.root, 'api', `${match[1]}.js`);
        if (!file || !existsSync(file)) return next();
        try {
          const handlers = await server.ssrLoadModule(file);
          const handler = handlers[req.method];
          if (!handler) {
            res.statusCode = 405;
            return res.end();
          }
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const headers = new Headers();
          Object.entries(req.headers).forEach(([key, value]) => {
            if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
          });
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method,
            headers,
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          server.ssrFixStacktrace(error);
          next(error);
        }
      });
    },
  };
}
