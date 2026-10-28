import "dotenv/config";

export const EMBEDDING_DIMENSIONS = 384;

/**
 * Local deterministic embedding for demos without an API key.
 * Not a semantic model — use OPENAI for real similarity search.
 */
export function localEmbed(text) {
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const vector = new Array(EMBEDDING_DIMENSIONS).fill(0);

  for (const token of tokens) {
    let hash = 2166136261;
    for (let i = 0; i < token.length; i += 1) {
      hash ^= token.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const index = Math.abs(hash) % EMBEDDING_DIMENSIONS;
    const sign = hash & 1 ? 1 : -1;
    vector[index] += sign;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

async function openAiEmbed(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when EMBEDDING_PROVIDER=openai");
  }

  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI embeddings failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const embedding = payload?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error("OpenAI embeddings response did not include a vector");
  }
  return embedding;
}

export async function embedText(text) {
  const provider = (process.env.EMBEDDING_PROVIDER || "local").toLowerCase();
  if (provider === "openai") {
    return openAiEmbed(text);
  }
  return localEmbed(text);
}
