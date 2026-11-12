import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const globalForDb = globalThis as unknown as { kleiderpfadPool?: Pool };
const pool = globalForDb.kleiderpfadPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});
if (process.env.NODE_ENV !== "production") globalForDb.kleiderpfadPool = pool;
export const db = drizzle(pool);