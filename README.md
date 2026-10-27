# AI Script Writer — Faceless Content SaaS

Pure script-generation platform for faceless content. The platform
generates scripts (with full visual direction in text); it does not
generate audio or video.

## Layout (pnpm + Turborepo monorepo)

- `apps/web` — user app (Next.js): onboarding, projects, Production
  Bible, run pipeline (topics -> config -> research -> outline ->
  script -> scenes -> audit -> package -> performance), settings.
- `apps/admin` — admin console (Next.js): taxonomy, questions,
  templates, angles, model providers, source library, users/credits,
  seeds, safety, audit log.
- `services/api` — Fastify API: auth (§3), projects & Bible (§5),
  runs & steps (§6), dynamic taxonomy/config (§6A), curated-first
  research (§6B), jobs & credits (§7), seeds (§9), platform —
  notifications, webhooks, YouTube, uploads (§10).
- `packages/shared` — canonical enums, pipeline, deliverables, DTOs.
- `docs/` — the design source of truth (workflow, seeds, audits).

## Run locally

```bash
pnpm install
docker compose up -d          # Postgres+pgvector, Redis, MinIO
cp .env.example .env          # fill AUTH_JWT_SECRET, bootstrap admin
pnpm --filter @scriptwriter/api db:migrate
pnpm --filter @scriptwriter/api seed:import   # 18,130 seed records
pnpm dev                      # api :4000, web :3000, admin :3001
```

Without provider API keys in `.env`, AI generation jobs fail cleanly
with `PROVIDER_NOT_CONFIGURED` — deterministic flows (audit checks,
packaging, dedupe keyword signals) still run. Set a stage's provider
key (e.g. `OPENAI_API_KEY`) and assignments in Admin -> Model
Providers to enable generation.

## Tests

```bash
pnpm typecheck   # 5/5 turbo tasks
pnpm --filter @scriptwriter/shared test
pnpm --filter @scriptwriter/api test
```
