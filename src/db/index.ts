import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Create .env.local (or set the Vercel env var) with your Neon connection string.",
  );
}

if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
  throw new Error(
    `DATABASE_URL is malformed (expected it to start with postgresql://). Got: ${databaseUrl.slice(0, 20)}...`,
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({ connectionString: databaseUrl });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);