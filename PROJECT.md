# AI Backend Factory

## Overview

AI Backend Factory is a backend-only NestJS service that accepts structured generation requests and produces deterministic, blueprint-aligned backend foundations under the local workspace root at `/home/matthew/personal/ai-backend-factory/repos`.

The repository is currently at the project-foundation stage. The implemented runtime surface now includes bootstrap infrastructure, environment validation, health and authentication endpoints, domain models for accounts, Generation Jobs, and notifications, plus Prisma-backed persistence adapters for those aggregates.

## Tech Stack

- Node.js 22+
- `mise`-managed `pnpm` 9
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
src/domain/factory/   Factory bounded context for account and generation-job code
src/domain/notification/ Notification bounded context
src/infra/database/   Prisma service, mappers, and repository adapters
src/infra/            Nest bootstrap, env, HTTP, and infrastructure adapters
test/                 Shared test helpers, factories, fakes, and setup
forum-blueprint.md    Primary architecture reference
CONTEXT.md            Evolving project memory
```

## Core Commands

```bash
mise install
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
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`

When the JWT variables are blank, the local auth flow falls back to an internal development/test secret so bootstrap and e2e auth coverage keep working before production key management is in place.

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
- Run `mise install` before `pnpm ...` commands on a new machine so the pinned toolchain from `mise.toml` is available.
- Keep generated services inside `repos/` and out of version control except for `repos/.gitkeep`.
