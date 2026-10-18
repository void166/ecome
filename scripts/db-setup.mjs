// Creates tables and seeds missing catalogue products/sizes. Existing prices and
// stock are left alone. Usage: DATABASE_URL=... npm run db:setup [-- --stock=10]
import { db, setupDatabase } from '../server/db.js';

const stockArg = process.argv.find((arg) => arg.startsWith('--stock='));
const stock = stockArg ? Number(stockArg.split('=')[1]) : 10;
const database = await db();
await setupDatabase(database, { stock });
const { rows } = await database.query('SELECT count(*)::int AS products FROM products');
console.log(`Database ready: ${rows[0].products} products.`);
process.exit(0);
