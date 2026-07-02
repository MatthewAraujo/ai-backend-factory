# AI Backend Factory

AI Backend Factory is a NestJS modular monolith that will let authenticated users submit deterministic backend generation jobs and receive blueprint-aligned generated services under a fixed local workspace root.

This repository currently contains the baseline T1 foundation only:
- NestJS bootstrap and health endpoint
- startup environment validation
- Prisma, Redis, Docker, CI, and test scaffolding
- onboarding and workflow documentation

Feature work for authentication, generation jobs, notifications, and generated-service templates is intentionally not implemented yet.

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

The endpoint returns a simple status payload so the scaffold can be exercised before feature work begins.

## Next Step

Continue with T2 from `docs/TASKS.md`: model the account, factory, and notification domains plus Prisma-backed persistence.

