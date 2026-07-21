# FaroBot Studio

An AI-powered code correction assistant — a private Claude-style interface for reviewing and rewriting GitHub-hosted code using HuggingFace AI models. Supports front-end and back-end corrections, language/writing improvements, and multi-language code analysis.

## Run & Operate

- `pnpm --filter @workspace/farobot-studio run dev` — run the frontend (auto-port)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `GITHUB_TOKEN` — GitHub Personal Access Token for repo browsing
- Optional env: `HUGGINGFACE_API_TOKEN` — HuggingFace token (can also be set in the app's Settings page)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- AI: HuggingFace Inference API (chat completions format)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema files (conversations, messages, app_settings)
- `artifacts/api-server/src/routes/` — API route handlers
- `artifacts/farobot-studio/src/` — React frontend

## Architecture decisions

- HuggingFace token stored in DB settings table; env var `HUGGINGFACE_API_TOKEN` is checked as fallback
- GitHub token read from `GITHUB_TOKEN` env var only (not stored in DB for security)
- File content fetch/update uses POST endpoints to avoid Orval `*Params` type collision with query params
- Settings endpoint masks HuggingFace token (shows `****xxxx` when set)
- Messages include optional `fileContext` to attach GitHub file content to AI prompts

## Product

- Chat interface (/) — Claude-style conversation with AI models from HuggingFace
- GitHub Explorer (/github) — Browse repos, navigate file trees, view and edit files, send to chat
- Settings (/settings) — Configure HuggingFace token, default model, and system prompt

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any schema file change in `lib/db/src/schema/`, run `pnpm run typecheck:libs` before typechecking artifact packages — stale declarations cause false TS2305 errors
- Orval generates `<OperationId>Params` for both Zod and TS types on GET endpoints with query params — use POST or path params instead to avoid TS2308 collisions
- Do not run `pnpm run codegen` before `pnpm run typecheck:libs` when both libs are interdependent

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
