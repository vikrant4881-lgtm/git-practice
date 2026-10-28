import express from "express";
import "dotenv/config";
import { checkDatabase, pool } from "./db.js";
import {
  createDocument,
  deleteDocument,
  listDocuments,
  searchDocuments,
} from "./documents.js";
import { EMBEDDING_DIMENSIONS } from "./embeddings.js";

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  try {
    const extension = await checkDatabase();
    res.json({
      ok: true,
      pgvector: extension,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
      embeddingProvider: process.env.EMBEDDING_PROVIDER || "local",
    });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message });
  }
});

app.get("/documents", async (req, res) => {
  try {
    const documents = await listDocuments({ limit: req.query.limit });
    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/documents", async (req, res) => {
  try {
    const document = await createDocument(req.body ?? {});
    res.status(201).json({ document });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/search", async (req, res) => {
  try {
    const { query: searchQuery, limit } = req.body ?? {};
    const results = await searchDocuments(searchQuery, { limit });
    res.json({ results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/documents/:id", async (req, res) => {
  try {
    const deleted = await deleteDocument(Number(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: "document not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "not found" });
});

const server = app.listen(port, host, () => {
  console.log(`pgvector API listening on http://${host}:${port}`);
});

async function shutdown() {
  server.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
