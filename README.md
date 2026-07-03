# AI Backend Factory

AI Backend Factory is a NestJS modular monolith that will let authenticated users submit deterministic backend generation jobs and receive blueprint-aligned generated services under a fixed local workspace root.

The current implementation includes:
- account registration and JWT-based login
- authenticated generation-job create, list, and detail endpoints
- in-app notification list and mark-as-read endpoints
- deterministic local generated-service output with in-process job execution
- Prisma, Redis, Docker, CI, and test scaffolding for the Factory Service

## Current Stack

- Node.js + TypeScript
- NestJS
- Prisma + PostgreSQL
- Redis
- Vitest + Supertest
- Biome
- GitHub Actions

## Setup

1. Copy the example environment files.
2. Start local infrastructure.
3. Install dependencies.
4. Generate the Prisma client.
5. Start the API or run tests.

```bash
cp .env.example .env
cp .env.example .env.test
docker compose up -d postgres redis
pnpm install
pnpm prisma:generate
pnpm start:dev
```

## Commands

```bash
pnpm start:dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm test:cov
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm prisma:migrate:deploy
```

## Baseline Structure

```text
src/
  core/
  domain/
  infra/
    env/
    http/
test/
prisma/
repos/
docs/
```

## Workflow Artifacts

- Product requirements: `docs/PRD.md`
- Task plan: `docs/TASKS.md`
- Project context: `CONTEXT.md`
- Architecture decisions: `docs/adr/`
- Architecture reference: `forum-blueprint.md`

## Implemented Endpoint

`GET /health`

Additional implemented API routes:
- `POST /accounts`
- `POST /sessions`
- `POST /generation-jobs`
- `GET /generation-jobs`
- `GET /generation-jobs/:id`
- `GET /notifications`
- `PATCH /notifications/:id/read`

## v1 Limits

- Generation runs in the same NestJS process as the HTTP API.
- Jobs are one-shot only: no retry or cancellation endpoints exist in v1.
- Output is always written under the configured workspace root.
- Generated services are deterministic generic foundations only; domain-specific business modules are out of scope.
