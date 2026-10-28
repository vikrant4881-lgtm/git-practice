import { pool } from "./db.js";
import { createDocument } from "./documents.js";

const samples = [
  {
    title: "Git branching basics",
    content:
      "Create feature branches from main, commit often, and open a pull request when the work is ready for review.",
    metadata: { topic: "git" },
  },
  {
    title: "Postgres vector search",
    content:
      "pgvector stores embeddings in Postgres and supports cosine distance queries for semantic similarity search.",
    metadata: { topic: "pgvector" },
  },
  {
    title: "Node API design",
    content:
      "Keep HTTP handlers thin, put database access in repositories, and return clear JSON errors for clients.",
    metadata: { topic: "api" },
  },
];

async function seed() {
  for (const sample of samples) {
    const document = await createDocument(sample);
    console.log(`Seeded document #${document.id}: ${document.title}`);
  }
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
