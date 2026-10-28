import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, query } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function waitForDb(retries = 30) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await query("SELECT 1");
      return;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function migrate() {
  await waitForDb();
  const sqlPath = path.join(__dirname, "..", "db", "init.sql");
  const sql = await fs.readFile(sqlPath, "utf8");
  await query(sql);
  const extension = await query(
    `SELECT extversion FROM pg_extension WHERE extname = 'vector'`
  );
  console.log(
    `Migration complete. pgvector version: ${extension.rows[0]?.extversion ?? "unknown"}`
  );
}

migrate()
  .catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
