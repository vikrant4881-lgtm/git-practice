import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/vectordb";

export const pool = new Pool({
  connectionString: databaseUrl,
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function withClient(fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export function toVectorLiteral(embedding) {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("embedding must be a non-empty number array");
  }
  return `[${embedding.map((value) => Number(value)).join(",")}]`;
}

export async function checkDatabase() {
  const result = await query(
    `SELECT extname, extversion
     FROM pg_extension
     WHERE extname = 'vector'`
  );
  if (result.rowCount === 0) {
    throw new Error("pgvector extension is not installed in this database");
  }
  return result.rows[0];
}
