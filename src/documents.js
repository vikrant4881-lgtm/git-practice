import { query, toVectorLiteral } from "./db.js";
import { embedText } from "./embeddings.js";

export async function createDocument({ title, content, metadata = {} }) {
  if (!title?.trim() || !content?.trim()) {
    throw new Error("title and content are required");
  }

  const embedding = await embedText(`${title}\n${content}`);
  const result = await query(
    `INSERT INTO documents (title, content, metadata, embedding)
     VALUES ($1, $2, $3::jsonb, $4::vector)
     RETURNING id, title, content, metadata, created_at, updated_at`,
    [title.trim(), content.trim(), JSON.stringify(metadata), toVectorLiteral(embedding)]
  );
  return result.rows[0];
}

export async function listDocuments({ limit = 50 } = {}) {
  const result = await query(
    `SELECT id, title, content, metadata, created_at, updated_at
     FROM documents
     ORDER BY created_at DESC
     LIMIT $1`,
    [Math.min(Number(limit) || 50, 200)]
  );
  return result.rows;
}

export async function searchDocuments(queryText, { limit = 5 } = {}) {
  if (!queryText?.trim()) {
    throw new Error("query is required");
  }

  const embedding = await embedText(queryText);
  const result = await query(
    `SELECT
       id,
       title,
       content,
       metadata,
       created_at,
       updated_at,
       1 - (embedding <=> $1::vector) AS similarity
     FROM documents
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [toVectorLiteral(embedding), Math.min(Number(limit) || 5, 50)]
  );
  return result.rows;
}

export async function deleteDocument(id) {
  const result = await query(
    `DELETE FROM documents WHERE id = $1
     RETURNING id`,
    [id]
  );
  return result.rows[0] ?? null;
}
