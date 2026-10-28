# Git Practice + pgvector

Learning Git/GitHub, now with **Postgres + pgvector** for semantic document search.

## What you get

- Docker Compose service running `pgvector/pgvector:pg16`
- SQL init that enables the `vector` extension and creates a `documents` table with an HNSW index
- Small Express API that stores text + embeddings and searches by cosine similarity

## Quick start

```bash
cp .env.example .env
npm install
npm run db:up
npm run migrate
npm run seed
npm start
```

API defaults to `http://localhost:3000`.

### Useful endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Confirms DB + pgvector are up |
| `POST` | `/documents` | `{ "title", "content", "metadata?" }` |
| `GET` | `/documents` | List recent documents |
| `POST` | `/search` | `{ "query", "limit?" }` cosine similarity search |
| `DELETE` | `/documents/:id` | Remove a document |

Example search:

```bash
curl -s http://localhost:3000/search \
  -H 'content-type: application/json' \
  -d '{"query":"how do vector embeddings work in postgres","limit":3}'
```

## Embeddings

- `EMBEDDING_PROVIDER=local` (default): deterministic offline vectors so the stack runs without an API key. Good for plumbing demos.
- `EMBEDDING_PROVIDER=openai`: set `OPENAI_API_KEY` for real semantic search (`text-embedding-3-small`, 384 dims).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run db:up` | Start Postgres + pgvector |
| `npm run db:down` | Stop containers |
| `npm run db:reset` | Wipe volume and recreate DB |
| `npm run migrate` | Apply `db/init.sql` |
| `npm run seed` | Insert sample documents |
| `npm run test:smoke` | Insert + search round-trip |
| `npm run dev` | API with `--watch` |

## Notes

The original `app.js` learning console logs are still in the repo. The vector API lives under `src/`.
