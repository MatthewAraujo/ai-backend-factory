# AI Backend Factory

## Overview

AI Backend Factory is a backend-only NestJS service that will accept structured generation requests and produce deterministic, blueprint-aligned backend foundations under the local workspace root at `/home/matthew/personal/ai-backend-factory/repos`.

The repository is currently at the project-foundation stage. The implemented runtime surface is limited to bootstrap infrastructure, environment validation, and a health endpoint.

## Tech Stack

- Node.js 22+
- TypeScript
- NestJS 11
- Prisma with PostgreSQL
- Redis
- JWT-based auth planned in the baseline stack
- Vitest + Supertest
- Biome
- Docker Compose
- GitHub Actions

## Repository Layout

```text
docs/                 Planning artifacts, ADRs, and requirements
prisma/               Prisma schema and future migrations
repos/                Generated-service workspace root
src/core/             Shared low-level primitives
src/domain/           Bounded contexts for account, factory, notification
src/infra/            Nest bootstrap, env, HTTP, and infrastructure adapters
test/                 Shared test helpers, factories, fakes, and setup
forum-blueprint.md    Primary architecture reference
CONTEXT.md            Evolving project memory
```

## Core Commands

```bash
cp .env.example .env
cp .env.example .env.test
docker compose up -d postgres redis
pnpm install
pnpm prisma:generate
pnpm start:dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Environment

Primary variables live in `.env` and `.env.test`.

Current bootstrap variables:
- `PORT`
- `DATABASE_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_DB`
- `WORKSPACE_ROOT`

Reserved for the upcoming auth module:
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`

Secrets must stay in local environment files or external secret stores and must not be committed.

## Quality Gates

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- `pnpm test:e2e`

CI is defined in `.github/workflows/ci.yml`.

## Documentation Links

- Requirements: `docs/PRD.md`
- Task plan: `docs/TASKS.md`
- ADRs: `docs/adr/`
- Context: `CONTEXT.md`

## Working Conventions

- Follow the workflow in the repository instructions: planning artifacts first, then task-by-task `tdd`.
- Use `forum-blueprint.md` as the architecture reference for layering, DI, testing style, and operations.
- Keep generated services inside `repos/` and out of version control except for `repos/.gitkeep`.

