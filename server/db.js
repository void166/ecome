import { mkdir, readFile } from 'node:fs/promises';
import { catalog, sizeSetFor } from '../src/catalog.js';
import { ConfigError } from './config.js';

// Postgres (Neon / Vercel Postgres / Supabase) when DATABASE_URL is set.
// Without it, local development uses an embedded PGlite database in .data/.
const state = globalThis.__voidDb || (globalThis.__voidDb = { ready: null });

async function connect() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: pg } = await import('pg');
    // TLS follows the URL's sslmode (Neon and Supabase URLs include sslmode=require).
    const pool = new pg.Pool({ connectionString: url, max: 3 });
    return {
      query: (text, params) => pool.query(text, params),
      async transaction(work) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await work(client);
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK').catch(() => {});
          throw error;
        } finally {
          client.release();
        }
      },
    };
  }

  if (process.env.VERCEL_ENV || process.env.NODE_ENV === 'production') {
    throw new ConfigError('DATABASE_URL is not configured');
  }
  // Variable specifier keeps the dev-only package out of the serverless bundle.
  const pgliteModule = '@electric-sql/pglite';
  const { PGlite } = await import(/* @vite-ignore */ pgliteModule);
  await mkdir('./.data', { recursive: true });
  const lite = new PGlite('./.data/pglite');
  const database = {
    query: (text, params) => lite.query(text, params),
    transaction: (work) => lite.transaction((tx) => work(tx)),
  };
  await setupDatabase(database);
  return database;
}

export function db() {
  if (!state.ready) {
    state.ready = connect().catch((error) => {
      state.ready = null;
      throw error;
    });
  }
  return state.ready;
}

// Creates the tables and inserts any catalogue product or size that is missing.
// Existing prices and stock are never overwritten.
export async function setupDatabase(database, { stock = 10 } = {}) {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  for (const statement of schema.split(/;\s*$/m).map((part) => part.trim()).filter(Boolean)) {
    await database.query(statement);
  }
  for (const [index, product] of catalog.entries()) {
    await database.query(
      `INSERT INTO products (id, name, category, price_mnt, color_name, position)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
      [product.id, product.name, product.category, product.priceMnt, product.colorName, index],
    );
    for (const [position, size] of sizeSetFor(product.category).entries()) {
      await database.query(
        `INSERT INTO product_sizes (product_id, size, stock, position)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [product.id, size, stock, position],
      );
    }
  }
}
