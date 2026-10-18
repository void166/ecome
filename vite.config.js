import { defineConfig, loadEnv } from 'vite';
import { devApi } from './server/dev-api.js';

export default defineConfig(({ mode }) => {
  // Server-side variables from .env for the dev API (shell variables win).
  Object.assign(process.env, { ...loadEnv(mode, process.cwd(), ''), ...process.env });
  return {
    plugins: [devApi()],
    server: { watch: { ignored: ['**/.data/**'] } },
  };
});
