import { pool } from "./db.js";
import { createDocument, searchDocuments } from "./documents.js";

async function smokeTest() {
  const document = await createDocument({
    title: "Semantic search smoke test",
    content: "This document verifies that pgvector similarity queries work end to end.",
    metadata: { source: "smoke-test" },
  });

  const results = await searchDocuments("vector similarity search", { limit: 3 });
  const found = results.some((row) => row.id === document.id);

  if (!found) {
    throw new Error("Seeded smoke-test document was not returned by search");
  }

  console.log("Smoke test passed.");
  console.log(
    results.map((row) => ({
      id: row.id,
      title: row.title,
      similarity: Number(row.similarity).toFixed(4),
    }))
  );
}

smokeTest()
  .catch((error) => {
    console.error("Smoke test failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
