# Backend Blueprint: Forum Modular Monolith API

## 1. Purpose

This blueprint extracts the reusable backend engineering style from the `forum` repository. The source system is a REST API for student accounts, questions, answers, comments, attachments, and notifications. The valuable part for reuse is not the forum domain itself, but the way the codebase separates domain logic, application use cases, infrastructure adapters, and tests.

Evidence:
- `src/infra/http/controllers/create-account.controller.ts`
- `src/infra/http/controllers/create-question.controller.ts`
- `src/infra/http/controllers/answer-question.controller.ts`
- `src/infra/http/controllers/read-notification.controller.ts`
- `prisma/schema.prisma`

Primary actors:
- Confirmed: `STUDENT` users create accounts, authenticate, create questions, answer, comment, upload attachments, and read notifications.
- Inferred: `INSTRUCTOR` is modeled in `prisma/schema.prisma` but is not yet active in controller or use-case behavior.

Runtime and deployment assumptions:
- Confirmed: single NestJS HTTP service, PostgreSQL database, Redis cache, Cloudflare R2 object storage.
- Inferred: deployment is a single-process modular monolith behind one HTTP port, with external managed services for data and storage.

## 2. Source Repository

Repository analyzed: `forum`

Inspected areas:
- Runtime and tooling: `package.json`, `nest-cli.json`, `tsconfig.json`, `vitest.config.ts`, `vitest.config.e2e.ts`, `biome.json`
- Infrastructure: `src/infra/app.module.ts`, `src/infra/main.ts`, `src/infra/database/**`, `src/infra/auth/**`, `src/infra/cache/**`, `src/infra/storage/**`, `src/infra/events/**`, `src/infra/http/**`, `src/infra/env/**`
- Domain and application: `src/domain/forum/**`, `src/domain/notification/**`, `src/core/**`
- Persistence: `prisma/schema.prisma`, `prisma/migrations/**`
- Tests: `test/**`, `src/**/*.spec.ts`, `src/**/*.e2e-spec.ts`
- Local operations: `docker-compose.yml`, `client.http`

What this blueprint is for:
- Starting a greenfield backend with the same engineering shape.
- Reusing the layering, port/adaptor patterns, testing approach, DI style, and operational defaults.

What this blueprint is not:
- A business-domain summary.
- A claim that every choice in the source repo is ideal. Gaps are called out explicitly in Section 20.

## 3. Tech Stack

| Area | Choice | Evidence | Status |
| --- | --- | --- | --- |
| Language/runtime | TypeScript on Node.js | `package.json`, `tsconfig.json` | Confirmed |
| Framework | NestJS 11 | `package.json`, `src/infra/app.module.ts` | Confirmed |
| Package manager | `pnpm` | `pnpm-lock.yaml`, scripts in `package.json` | Confirmed |
| Database | PostgreSQL | `prisma/schema.prisma`, `docker-compose.yml` | Confirmed |
| ORM | Prisma | `package.json`, `src/infra/database/prisma/**` | Confirmed |
| Cache | Redis via `ioredis` | `package.json`, `src/infra/cache/redis/redis.service.ts` | Confirmed |
| Object storage | Cloudflare R2 through S3 API | `src/infra/storage/r2-storage.ts` | Confirmed |
| AuthN | JWT with RS256, Passport JWT | `src/infra/auth/auth.module.ts`, `src/infra/auth/jwt.strategy.ts` | Confirmed |
| AuthZ | Route guard plus ownership checks inside use cases | `src/infra/auth/jwt-auth.guard.ts`, `src/domain/forum/application/use-cases/edit-question.ts` | Confirmed |
| Request validation | Zod plus custom Nest pipe | `src/infra/http/pipes/zod-validation-pipe.ts` | Confirmed |
| File validation | Nest `ParseFilePipe`, type and size validators | `src/infra/http/controllers/upload-attachment.controller.ts` | Confirmed |
| Password hashing | `bcryptjs` | `src/infra/cryptography/bcrypt-hasher.ts` | Confirmed |
| Testing | Vitest, Supertest, Nest testing module, Faker | `package.json`, `vitest.config.ts`, `vitest.config.e2e.ts`, `test/factories/make-student.ts` | Confirmed |
| Build/test transpilation | Nest CLI, SWC in Vitest | `package.json`, `nest-cli.json`, `vitest.config.ts` | Confirmed |
| Lint/format | Biome | `biome.json`, `package.json` | Confirmed |
| CI/CD | No workflow config present | repository scan, no `.github/workflows/*` | Confirmed gap |
| Queue/broker | None present | repository scan | Confirmed gap |

## 4. Repository Structure

Recommended takeaway: keep business rules in `domain`, dependency contracts in `application`, adapters in `infra`, and shared primitives in `core`.

Evidence:
- `src/core/entities/*`
- `src/domain/forum/application/use-cases/*`
- `src/domain/forum/enterprise/entities/*`
- `src/domain/notification/application/*`
- `src/infra/http/*`
- `src/infra/database/prisma/*`
- `test/*`

Folder responsibilities:
- `src/core`: low-level primitives shared across bounded contexts.
  - Examples: `entity.ts`, `aggregate-root.ts`, `unique-entity-id.ts`, `either.ts`, `domain-events.ts`
- `src/domain/forum/enterprise`: rich domain objects for the forum context.
  - Entities, value objects, and domain events live here.
- `src/domain/forum/application`: use cases, repository ports, crypto ports, storage ports.
  - This is the orchestration layer.
- `src/domain/notification/*`: a second bounded context implemented with the same shape.
- `src/infra/auth`: JWT strategy, guard, decorators, public-route metadata.
- `src/infra/http`: controllers, request validation, presenters.
- `src/infra/database/prisma`: Prisma service, mappers, repository implementations.
- `src/infra/cache`, `src/infra/storage`, `src/infra/cryptography`: adapter modules behind application ports.
- `src/infra/events`: Nest module that instantiates event subscribers.
- `prisma`: schema and SQL migrations.
- `test`: factories, in-memory repositories, fake adapters, shared test helpers.

## 5. Architectural Style

### Pattern: Domain / application / infrastructure separation

Evidence:
- `src/domain/forum/application/use-cases/create-question.ts`
- `src/domain/forum/enterprise/entities/question.ts`
- `src/infra/http/controllers/create-question.controller.ts`
- `src/infra/database/prisma/repositories/prisma-questions-repository.ts`

Why it matters:
Business rules stay independent from Nest, Prisma, Redis, and S3. That makes use cases easier to unit test and adapters easier to replace.

How to reuse:
Create the same top-level split for each new bounded context:
- `enterprise` for entities and value objects
- `application` for use cases and ports
- `infra` for controllers, persistence, auth, cache, storage, and event wiring

When not to use:
If the service is a tiny CRUD-only internal tool with no meaningful business logic, this split may be heavier than necessary.

### Pattern: Use-case driven application layer

Evidence:
- `src/domain/forum/application/use-cases/register-student.ts`
- `src/domain/forum/application/use-cases/authenticate-student.ts`
- `src/domain/forum/application/use-cases/edit-question.ts`
- `src/infra/http/http.module.ts`

Why it matters:
Each operation has a single orchestration class with explicit inputs, outputs, and dependencies. Controllers stay thin, and behavior remains easy to test in isolation.

How to reuse:
Model one class per business action. Inject only the ports needed for that action. Keep the class responsible for orchestration, authorization rules, and aggregate coordination.

When not to use:
Do not create use cases for trivial pass-through operations if they add no behavior beyond a repository call.

### Pattern: Ports and adapters

Evidence:
- `src/domain/forum/application/repositories/questions-repository.ts`
- `src/domain/forum/application/cryptography/hash-generator.ts`
- `src/domain/forum/application/storage/uploader.ts`
- `src/infra/database/database.module.ts`
- `src/infra/cryptography/cryptography.module.ts`
- `src/infra/storage/storage.module.ts`

Why it matters:
Application logic depends on abstract contracts, not on Prisma, bcrypt, JWT, Redis, or S3 directly.

How to reuse:
Define abstract classes or interfaces in the application layer and bind them to concrete Nest providers in infrastructure modules.

When not to use:
Avoid creating ports for utilities that will never vary and do not affect testability. This repo keeps ports for persistence, crypto, cache, and storage because those boundaries matter.

### Pattern: DDD-lite aggregates, value objects, and in-process domain events

Evidence:
- `src/domain/forum/enterprise/entities/question.ts`
- `src/domain/forum/enterprise/entities/answer.ts`
- `src/domain/forum/enterprise/entities/value-objects/slug.ts`
- `src/core/events/domain-events.ts`
- `src/domain/notification/application/subscribers/on-answer-created.ts`
- `src/domain/notification/application/subscribers/on-question-best-answer-chosen.ts`

Why it matters:
The domain model carries behavior, derived data, and side-effect triggers. Notifications are decoupled from write use cases through domain events.

How to reuse:
Use aggregates when business actions mutate multiple invariants or trigger follow-up work. Add value objects for derived or constrained concepts like slugs and detailed read models.

When not to use:
Do not force rich aggregates onto simple record stores with no domain behavior. Also do not use in-process events for mission-critical cross-service workflows that require durability.

## 6. Dependency Injection

DI container:
- Nest module system.

Provider registration pattern:
- Abstract-class tokens are bound with `useClass`.
- Feature modules import infrastructure modules and list use cases as providers.

Evidence:
- `src/infra/http/http.module.ts`
- `src/infra/database/database.module.ts`
- `src/infra/cryptography/cryptography.module.ts`
- `src/infra/storage/storage.module.ts`
- `src/infra/cache/cache.module.ts`

Interface-to-implementation binding:
- `QuestionsRepository -> PrismaQuestionsRepository`
- `HashGenerator -> BcryptHasher`
- `HashComparer -> BcryptHasher`
- `Encrypter -> JwtEncrypter`
- `Uploader -> R2Storage`
- `CacheRepository -> RedisCacheRepository`

Service lifetimes:
- Default Nest singleton scope is used everywhere. No request-scoped providers are present.

Dependency inversion boundaries:
- Use cases depend on repository, crypto, cache, and storage ports.
- Controllers depend on use cases.
- Adapters depend on framework or vendor SDKs.

Test replacement strategy:
- Unit tests bypass Nest and instantiate use cases directly with in-memory repositories and fake adapters.
- E2E tests boot Nest with real modules and real JWT/Prisma wiring.

Evidence:
- `src/domain/forum/application/use-cases/create-question.spec.ts`
- `test/repositories/in-memory-questions-repository.ts`
- `test/storage/fake-uploader.ts`
- `src/infra/http/controllers/create-question.controller.e2e-spec.ts`

Anti-patterns to avoid:
- Injecting `PrismaService` directly into use cases.
- Binding concrete vendor SDKs in the application layer.
- Hiding provider mappings in a monolithic root module instead of small infrastructure modules.

## 7. SOLID and Engineering Principles

### Single Responsibility Principle

Evidence:
- `src/infra/http/controllers/authenticate.controller.ts`
- `src/domain/forum/application/use-cases/authenticate-student.ts`
- `src/infra/database/prisma/mappers/prisma-question-mapper.ts`

Repository behavior:
- Controllers translate HTTP to use-case calls.
- Use cases orchestrate business behavior.
- Mappers translate between Prisma and domain objects.
- Repositories persist aggregates and value objects.

Reuse rule:
Keep translation, orchestration, and persistence separate even when Nest makes it easy to combine them.

### Open / Closed Principle

Evidence:
- `src/domain/forum/application/storage/uploader.ts`
- `src/infra/storage/storage.module.ts`
- `test/storage/fake-uploader.ts`

Repository behavior:
Object storage can change without changing the upload use case because the use case only depends on `Uploader`.

Reuse rule:
Introduce ports where vendor swaps or test doubles are realistic.

### Liskov Substitution Principle

Evidence:
- `src/domain/forum/application/repositories/questions-repository.ts`
- `test/repositories/in-memory-questions-repository.ts`
- `src/infra/database/prisma/repositories/prisma-questions-repository.ts`

Repository behavior:
Both in-memory and Prisma repositories satisfy the same application contract closely enough that the same use case tests can be written against either style.

Reuse rule:
Keep port contracts small and behaviorally consistent so test doubles remain honest substitutes.

### Interface Segregation Principle

Evidence:
- `src/domain/forum/application/cryptography/hash-generator.ts`
- `src/domain/forum/application/cryptography/hash-comparer.ts`
- `src/domain/forum/application/cryptography/encrypter.ts`

Repository behavior:
Crypto capabilities are split into focused abstractions instead of a single catch-all auth service.

Reuse rule:
Prefer narrow ports for behavior that is used independently.

### Dependency Inversion Principle

Evidence:
- `src/domain/forum/application/use-cases/register-student.ts`
- `src/domain/forum/application/use-cases/upload-and-create-attachment.ts`
- `src/infra/database/database.module.ts`

Repository behavior:
High-level policies depend on abstractions, while Nest modules connect them to low-level implementations.

Reuse rule:
Keep all application constructors free of framework-specific classes.

### KISS, YAGNI, DRY, testability

Evidence:
- `src/infra/http/pipes/zod-validation-pipe.ts`
- `src/infra/http/presenters/question-presenter.ts`
- `src/domain/forum/application/use-cases/fetch-recent-questions.ts`
- `test/factories/make-student.ts`

Repository behavior:
- KISS: direct use-case classes, straightforward modules, minimal metaprogramming.
- YAGNI: no CQRS bus, no queue broker, no generic base repository, no versioned API layer.
- DRY: validation pipe, presenters, mappers, factories, and in-memory repositories reduce repetition.
- Testability: the entire application layer is constructor-injected and unit-tested without Nest bootstrapping.

Weak spots:
- Controller-level exception mapping is repetitive across endpoints.
- Multi-step writes in repositories are not wrapped in transactions.

Evidence:
- `src/infra/http/controllers/create-account.controller.ts`
- `src/infra/http/controllers/authenticate.controller.ts`
- `src/infra/database/prisma/repositories/prisma-questions-repository.ts`
- `src/infra/database/prisma/repositories/prisma-answers-repository.ts`

## 8. Testing Strategy

### Pattern: Fast unit tests around use cases

Evidence:
- `src/domain/forum/application/use-cases/create-question.spec.ts`
- `src/domain/forum/application/use-cases/get-question-by-slug.spec.ts`
- `src/domain/notification/application/use-cases/read-notification.spec.ts`
- `test/repositories/in-memory-questions-repository.ts`
- `test/cryptography/fake-hasher.ts`

Why it matters:
Most business behavior is verified without Nest, Prisma, Redis, or JWT setup.

How to reuse:
Build in-memory repositories and fake adapters that implement the same ports as production adapters. Instantiate use cases directly in tests.

When not to use:
Do not rely only on unit tests when behavior depends on ORM includes, cache invalidation, auth middleware, or multipart uploads.

### Pattern: Behavioral tests for domain events

Evidence:
- `src/domain/notification/application/subscribers/on-answer-created.spec.ts`
- `src/domain/notification/application/subscribers/on-question-best-answer-chosen.spec.ts`
- `test/utils/wait-for.ts`

Why it matters:
Cross-cutting side effects stay decoupled while still being regression-tested.

How to reuse:
Test event subscribers by spying on the use case they trigger and creating aggregates through repositories that dispatch domain events.

When not to use:
If side effects become distributed or durable, move to explicit outbox or queue testing instead.

### Pattern: Repository and API e2e tests with real infrastructure

Evidence:
- `src/infra/database/prisma/repositories/prisma-questions-repository.e2e-spec.ts`
- `src/infra/http/controllers/create-question.controller.e2e-spec.ts`
- `src/infra/http/controllers/authenticate.controller.e2e-spec.ts`
- `src/infra/http/controllers/upload-attachment.controller.e2e-spec.ts`

Why it matters:
These tests verify Prisma mappings, Redis cache behavior, JWT integration, and HTTP request handling.

How to reuse:
Keep a small but meaningful e2e suite per critical vertical slice: auth, one write endpoint, one read endpoint, and one infrastructure-heavy endpoint such as upload or caching.

When not to use:
Do not make every branch of business logic an e2e test. Keep most cases in unit tests.

Test database and cache setup:
- `.env` and `.env.test` are loaded.
- A unique PostgreSQL schema is generated for the test run.
- Redis DB is flushed before the suite.
- Prisma migrations are deployed before tests.
- Domain events are disabled during shared e2e setup to avoid background side effects.

Evidence:
- `test/setup-e2e.ts`

Fixtures and factories:
- Domain object factories under `test/factories/*`
- In-memory repositories under `test/repositories/*`
- Fake adapters under `test/cryptography/*` and `test/storage/*`

Commands:
- `pnpm test`
- `pnpm test:cov`
- `pnpm test:e2e`

Coverage expectations:
- Coverage command exists.
- No threshold or CI enforcement is present.

Recommended testing pyramid for future projects:
- 70-80% use-case unit tests with in-memory/fake ports
- 10-20% adapter and repository integration tests
- 10% HTTP e2e tests for critical flows

## 9. API Design

Route organization:
- One controller per use case or closely related action.
- REST-style routes with resource-oriented paths.

Evidence:
- `src/infra/http/controllers/create-account.controller.ts`
- `src/infra/http/controllers/authenticate.controller.ts`
- `src/infra/http/controllers/create-question.controller.ts`
- `src/infra/http/controllers/fetch-recent-questions.controller.ts`
- `src/infra/http/controllers/read-notification.controller.ts`

Request validation:
- JSON payloads use Zod through a reusable pipe.
- File uploads use Nest file pipes with explicit size and type validators.

Evidence:
- `src/infra/http/pipes/zod-validation-pipe.ts`
- `src/infra/http/controllers/upload-attachment.controller.ts`

Response shape:
- Presenters map domain objects into HTTP JSON for read endpoints.
- Some write endpoints return no body and rely on status code.

Evidence:
- `src/infra/http/presenters/question-presenter.ts`
- `src/infra/http/presenters/question-details-presenter.ts`
- `src/infra/http/controllers/fetch-recent-questions.controller.ts`

Pagination, filtering, sorting:
- Simple page-based pagination only.
- No filtering or sorting API layer beyond repository-defined defaults.

Evidence:
- `src/infra/http/controllers/fetch-recent-questions.controller.ts`
- `src/domain/forum/application/repositories/questions-repository.ts`
- `src/infra/database/prisma/repositories/prisma-questions-repository.ts`

Error handling:
- Domain errors are translated inside controllers.
- Validation errors get a structured 400 body from the custom Zod pipe.
- Some controllers collapse all failures to `BadRequestException`, which is workable but blunt.

Evidence:
- `src/infra/http/controllers/create-account.controller.ts`
- `src/infra/http/controllers/authenticate.controller.ts`
- `src/infra/http/controllers/read-notification.controller.ts`
- `src/infra/http/pipes/zod-validation-pipe.ts`

Status code usage:
- `201` for successful create/auth endpoints
- `204` for read-notification state change
- `200` for reads by default
- `401` and `409` on mapped auth and uniqueness failures

Auth guards and middleware:
- Global JWT guard protects all routes by default.
- `@Public()` marks exceptions.
- `@CurrentUser()` injects authenticated user payload.

Evidence:
- `src/infra/auth/auth.module.ts`
- `src/infra/auth/jwt-auth.guard.ts`
- `src/infra/auth/public.ts`
- `src/infra/auth/current-user-decorator.ts`

Versioning and OpenAPI:
- No API versioning.
- No Swagger/OpenAPI generation found.

## 10. Data and Persistence

Entity and table model:
- Users, questions, answers, comments, attachments, and notifications.
- Unique constraints on user email, question slug, and question best answer.
- FK relationships capture authorship and ownership.

Evidence:
- `prisma/schema.prisma`
- `prisma/migrations/20250611173523_init/migration.sql`
- `prisma/migrations/20250611193705_notification/migration.sql`

Repository pattern:
- Application layer declares abstract repositories.
- Prisma adapters implement them and use dedicated mappers.

Evidence:
- `src/domain/forum/application/repositories/questions-repository.ts`
- `src/infra/database/prisma/repositories/prisma-questions-repository.ts`
- `src/infra/database/prisma/mappers/prisma-question-mapper.ts`

Query organization:
- Simple aggregate fetches use repository methods.
- Rich read models use value objects and explicit Prisma `include`.

Evidence:
- `src/domain/forum/enterprise/entities/value-objects/question-details.ts`
- `src/infra/database/prisma/mappers/prisma-question-details-mapper.ts`
- `src/infra/database/prisma/repositories/prisma-questions-repository.ts`

Cache strategy:
- Cache-aside for `question:{slug}:details`.
- Cache invalidation occurs on question save.

Evidence:
- `src/infra/cache/cache-repository.ts`
- `src/infra/database/prisma/repositories/prisma-questions-repository.ts`
- `src/infra/database/prisma/repositories/prisma-questions-repository.e2e-spec.ts`

Transactions and consistency:
- Multi-step writes exist for question/answer plus attachments.
- No Prisma transaction wrapper is used.

Evidence:
- `src/infra/database/prisma/repositories/prisma-questions-repository.ts`
- `src/infra/database/prisma/repositories/prisma-answers-repository.ts`

Reuse rule:
If a greenfield service has cross-table writes, keep the repository boundary but add explicit transactions early.

Seeds and migrations:
- SQL migrations are committed.
- No seed scripts are present.

Connection management:
- Prisma client connects on module init and disconnects on module destroy.

Evidence:
- `src/infra/database/prisma/prisma.service.ts`

Persistence error handling:
- Repositories generally return `null` for misses and let underlying Prisma errors bubble.
- There is no repository-level error translation strategy.

## 11. Configuration and Environment

Configuration pattern:
- Environment is validated once at startup with Zod.
- Application code consumes a typed `EnvService`.

Evidence:
- `src/infra/app.module.ts`
- `src/infra/env/env.ts`
- `src/infra/env/env.service.ts`

Environment variables in use:
- `DATABASE_URL`
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`
- `CLOUDFLARE_ACCOUNT_ID`
- `AWS_BUCKET_NAME`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_DB`
- `PORT`

Local development setup:
- PostgreSQL and Redis are provided through Docker Compose.

Evidence:
- `docker-compose.yml`

Test environment setup:
- Test bootstrap loads `.env` and `.env.test`.
- `DATABASE_URL` is rewritten per run to a unique schema.

Evidence:
- `test/setup-e2e.ts`

Secret handling:
- Secrets are expected in environment variables only.
- JWT keys are base64-encoded strings that are decoded in the auth module.

Evidence:
- `src/infra/auth/auth.module.ts`

Environment-specific behavior:
- Minimal. The main branch of variation is external endpoints and credentials, not code branches.

## 12. Observability and Operations

Logging:
- Nest bootstraps with `ConsoleLogger`.
- One controller uses an explicit Nest logger.
- A repository contains raw `console.log` debug statements, which should not be copied into a production template.

Evidence:
- `src/infra/main.ts`
- `src/infra/http/controllers/create-question.controller.ts`
- `src/infra/database/prisma/repositories/prisma-notifications-repository.ts`

Health checks, readiness, liveness:
- Not present.

Metrics and tracing:
- Not present.

Error reporting:
- No Sentry, Datadog, or equivalent integration found.

Background jobs:
- None. Domain events are in-process callbacks only.

Retries and resilience:
- No explicit retry strategy around Redis, Prisma, or object storage operations.

Rate limiting:
- Not present.

Operational scripts:
- Local operations rely on `docker-compose.yml`, Nest scripts, Prisma migrations, and `client.http`.

Evidence:
- `docker-compose.yml`
- `package.json`
- `client.http`

## 13. Security

Authentication:
- JWT bearer auth with RS256.
- Public/private keys are provided through env vars.

Evidence:
- `src/infra/auth/auth.module.ts`
- `src/infra/auth/jwt.strategy.ts`

Authorization:
- Default-deny at route level through a global JWT guard.
- Ownership checks are enforced inside use cases, not just in controllers.

Evidence:
- `src/infra/auth/jwt-auth.guard.ts`
- `src/domain/forum/application/use-cases/edit-question.ts`
- `src/domain/forum/application/use-cases/delete-answer.ts`
- `src/domain/notification/application/use-cases/read-notification.ts`

Input validation:
- Zod validates request bodies and query params.
- File uploads are size-limited and type-limited.

Evidence:
- `src/infra/http/pipes/zod-validation-pipe.ts`
- `src/infra/http/controllers/fetch-recent-questions.controller.ts`
- `src/infra/http/controllers/upload-attachment.controller.ts`

Password and token handling:
- Passwords are hashed with bcrypt.
- JWT payloads are parsed with Zod in the strategy.

Evidence:
- `src/infra/cryptography/bcrypt-hasher.ts`
- `src/infra/auth/jwt.strategy.ts`

Sensitive data handling:
- Secrets stay in env vars.
- Passwords are persisted hashed, not plain text.

Evidence:
- `src/domain/forum/application/use-cases/register-student.ts`
- `prisma/schema.prisma`

Injection prevention:
- Prisma ORM reduces direct SQL usage in application flows.
- One raw SQL statement exists in test teardown only, for schema cleanup.

Evidence:
- `src/infra/database/prisma/repositories/*.ts`
- `test/setup-e2e.ts`

Security gaps:
- No CORS configuration found.
- No security headers or `helmet`.
- No rate limiting or brute-force protection.
- No refresh-token or session revocation flow.
- `INSTRUCTOR` role exists in the schema but is not enforced in authorization paths.

## 14. Developer Experience

Install and run commands:
- `pnpm install`
- `pnpm start:dev`
- `pnpm build`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm lint`

Evidence:
- `package.json`

Helpful DX patterns:
- `client.http` provides local API call examples.
- Factories make database-backed e2e setup concise.
- In-memory repositories make unit tests fast and readable.

Evidence:
- `client.http`
- `test/factories/make-student.ts`
- `test/repositories/in-memory-questions-repository.ts`

Recommended first-time developer workflow:
1. `docker compose up -d`
2. Set `.env` and `.env.test`
3. `pnpm install`
4. `pnpm prisma migrate deploy`
5. `pnpm start:dev`
6. `pnpm test`
7. `pnpm test:e2e`

Weak spots:
- No README.
- No checked-in `.env.example`.
- No single bootstrap command for local setup.

## 15. CI/CD and Quality Gates

Current state:
- The repository exposes local quality gates but no CI pipeline configuration.

Evidence:
- `package.json`
- repository scan found no `.github/workflows/*`

Available local gates:
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:cov`

Minimum CI pipeline to copy into a greenfield project:
1. Install dependencies with `pnpm`
2. Run `pnpm lint`
3. Run `pnpm build`
4. Run `pnpm test`
5. Run `pnpm test:e2e` against ephemeral Postgres and Redis
6. Publish coverage report

Recommended merge requirements:
- All checks green
- Migrations validated
- No production debug logging
- No uncovered critical use cases

## 16. Reusable Patterns

### Pattern: Thin controllers, explicit use cases

Evidence:
- `src/infra/http/controllers/create-question.controller.ts`
- `src/domain/forum/application/use-cases/create-question.ts`

Why it matters:
This keeps HTTP concerns and business orchestration separate.

How to reuse:
For each new endpoint, add one controller method and one use-case class. Keep controller logic limited to validation, auth extraction, and exception translation.

When not to use:
If multiple endpoints truly share identical orchestration, reuse one use case instead of creating near-duplicate classes.

### Pattern: Abstract ports for every external dependency boundary

Evidence:
- `src/domain/forum/application/repositories/questions-repository.ts`
- `src/domain/forum/application/storage/uploader.ts`
- `src/domain/forum/application/cryptography/encrypter.ts`

Why it matters:
Persistence, storage, crypto, and cache can be tested or replaced without changing application code.

How to reuse:
Define ports in `application`, then bind production adapters in one infrastructure module per concern.

When not to use:
Avoid inventing ports for helpers that do not affect architecture or tests.

### Pattern: Read-model specific repositories plus presenters

Evidence:
- `src/domain/forum/enterprise/entities/value-objects/question-details.ts`
- `src/infra/database/prisma/repositories/prisma-questions-repository.ts`
- `src/infra/http/presenters/question-details-presenter.ts`

Why it matters:
It keeps rich read endpoints from polluting write aggregates with transport-specific concerns.

How to reuse:
Create explicit read value objects for endpoints that join multiple tables or need denormalized response data.

When not to use:
If a response is just the aggregate itself, a dedicated read model may be unnecessary.

### Pattern: In-memory repository suite mirrors production ports

Evidence:
- `test/repositories/in-memory-questions-repository.ts`
- `test/repositories/in-memory-answers-repository.ts`
- `test/repositories/in-memory-notifications-repository.ts`

Why it matters:
The application layer can be tested quickly without booting Nest or external services.

How to reuse:
Implement one in-memory version per repository port as soon as you add the production contract.

When not to use:
Do not let in-memory behavior drift away from production semantics.

### Pattern: In-process domain events for internal side effects

Evidence:
- `src/core/events/domain-events.ts`
- `src/domain/forum/enterprise/entities/answer.ts`
- `src/domain/notification/application/subscribers/on-answer-created.ts`

Why it matters:
Notifications are triggered without coupling the answer creation use case directly to notification logic.

How to reuse:
Use this for simple internal side effects that can safely happen in-process inside the same monolith.

When not to use:
Do not use this as a substitute for durable eventing across services or for long-running jobs.

## 17. Anti-Patterns to Avoid

### Anti-pattern: Leaking infrastructure types into the application layer

Evidence:
- The repo avoids this in `src/domain/forum/application/use-cases/*.ts`
- Infrastructure coupling is isolated to `src/infra/**`

Why to avoid it:
You lose the testability and replaceability that make this architecture valuable.

### Anti-pattern: Multi-step persistence without transactions

Evidence:
- `src/infra/database/prisma/repositories/prisma-questions-repository.ts`
- `src/infra/database/prisma/repositories/prisma-answers-repository.ts`

Why to avoid it:
Question or answer writes can partially succeed if one step fails after another has committed.

Preferred replacement:
Keep the repository boundary but wrap related DB changes in `prisma.$transaction`.

### Anti-pattern: Repeating controller-side exception mapping everywhere

Evidence:
- `src/infra/http/controllers/create-account.controller.ts`
- `src/infra/http/controllers/authenticate.controller.ts`
- `src/infra/http/controllers/read-notification.controller.ts`

Why to avoid it:
It leads to inconsistent status codes and duplicated translation logic.

Preferred replacement:
Introduce a shared exception mapper or global exception filter once the number of use cases grows.

### Anti-pattern: Carrying debug `console.log` statements into repositories

Evidence:
- `src/infra/database/prisma/repositories/prisma-notifications-repository.ts`

Why to avoid it:
Repository internals should emit structured logs through the application logger strategy, not ad hoc stdout noise.

## 18. Greenfield Backend Starter Guide

Recommended initial folder structure:

```text
src/
  core/
    entities/
    errors/
    events/
    repositories/
    types/
  domain/
    <bounded-context>/
      enterprise/
        entities/
        events/
        value-objects/
      application/
        repositories/
        use-cases/
        cryptography/
        storage/
  infra/
    auth/
    cache/
    cryptography/
    database/
      prisma/
        mappers/
        repositories/
    env/
    events/
    http/
      controllers/
      pipes/
      presenters/
    storage/
test/
  factories/
  repositories/
  cryptography/
  storage/
```

First files to create:
1. `src/infra/app.module.ts`
2. `src/infra/main.ts`
3. `src/infra/env/env.ts`
4. `src/infra/env/env.service.ts`
5. One repository port in `src/domain/<context>/application/repositories/`
6. One aggregate in `src/domain/<context>/enterprise/entities/`
7. One use case in `src/domain/<context>/application/use-cases/`
8. One controller and presenter in `src/infra/http/`
9. One Prisma mapper and repository implementation
10. One in-memory repository and one e2e setup file

Required dependencies to copy first:
- NestJS core packages
- Prisma and `@prisma/client`
- Zod
- Passport JWT and Nest JWT
- `bcryptjs`
- Vitest and Supertest
- Faker for factories
- Biome
- `ioredis`

DI setup:
- Create one infrastructure module per adapter concern.
- Bind abstract application ports with `useClass`.
- Keep feature use cases registered close to the controllers that use them.

Config setup:
- Validate env vars with Zod at `ConfigModule.forRoot`.
- Provide a typed `EnvService` wrapper so vendor adapters do not read raw `process.env`.

Database setup:
- Start with Prisma schema and committed SQL migrations.
- Add a repository adapter and mapper per aggregate root or read model.
- Add transactions for multi-table writes from day one.

First endpoint pattern:
- Public `POST /accounts` or auth endpoint
- Protected `POST /resources`
- Paginated `GET /resources?page=1`

First service/use-case pattern:
- Constructor-inject repository and support ports
- Return an explicit result type
- Perform authorization checks in the use case, not only in the controller

First repository/adapter pattern:
- Application port in `src/domain/.../application/repositories`
- Prisma implementation in `src/infra/database/prisma/repositories`
- Mapper in `src/infra/database/prisma/mappers`

First unit test pattern:
- Add an in-memory repository
- Instantiate the use case directly
- Assert state changes and returned result objects

First integration/e2e test pattern:
- Boot a Nest test app
- Use a per-run schema
- Run migrations
- Call one protected endpoint through Supertest
- Assert both HTTP output and DB state

Minimum CI quality gates:
- `pnpm lint`
- `pnpm build`
- `pnpm test`
- `pnpm test:e2e`
- coverage upload

## 19. Evidence Matrix

| Blueprint claim | Primary evidence | Notes |
| --- | --- | --- |
| Clean separation between domain, application, and infrastructure | `src/domain/forum/application/use-cases/create-question.ts`, `src/domain/forum/enterprise/entities/question.ts`, `src/infra/http/controllers/create-question.controller.ts` | Strongest architectural signal in the repo |
| Ports and adapters are intentional | `src/domain/forum/application/repositories/questions-repository.ts`, `src/infra/database/database.module.ts`, `src/infra/storage/storage.module.ts` | Reused across persistence, crypto, cache, storage |
| Business actions are modeled as use cases | `src/infra/http/http.module.ts`, `src/domain/forum/application/use-cases/*.ts` | One class per action pattern |
| Rich domain objects carry behavior | `src/domain/forum/enterprise/entities/question.ts`, `src/domain/forum/enterprise/entities/answer.ts` | Slug generation, timestamps, excerpts, event dispatch |
| Notifications are decoupled by domain events | `src/core/events/domain-events.ts`, `src/domain/notification/application/subscribers/on-answer-created.ts` | In-process eventing only |
| Request validation is explicit and reusable | `src/infra/http/pipes/zod-validation-pipe.ts`, `src/infra/http/controllers/upload-attachment.controller.ts` | JSON and multipart paths both validated |
| Auth is default-protected | `src/infra/auth/auth.module.ts`, `src/infra/auth/jwt-auth.guard.ts`, `src/infra/auth/public.ts` | Public routes opt out explicitly |
| Tests favor unit speed plus selective e2e realism | `src/domain/forum/application/use-cases/create-question.spec.ts`, `src/infra/http/controllers/create-question.controller.e2e-spec.ts`, `test/setup-e2e.ts` | Good pyramid foundation |
| Cache-aside read model exists | `src/infra/database/prisma/repositories/prisma-questions-repository.ts`, `src/infra/database/prisma/repositories/prisma-questions-repository.e2e-spec.ts` | Good reusable pattern |
| Persistence currently lacks transactions | `src/infra/database/prisma/repositories/prisma-questions-repository.ts`, `src/infra/database/prisma/repositories/prisma-answers-repository.ts` | Important improvement area |
| Security is solid on auth basics but limited operationally | `src/infra/auth/jwt.strategy.ts`, `src/infra/cryptography/bcrypt-hasher.ts`, repository scan for missing CORS/helmet/rate limiting | Needs hardening in production template |
| CI/CD is not yet implemented | `package.json`, repository scan for missing `.github/workflows/*` | Must be added in greenfield reuse |

## 20. Gaps and Recommended Improvements

1. Add transaction boundaries for repository writes that span root records plus attachments.
   Evidence:
   - `src/infra/database/prisma/repositories/prisma-questions-repository.ts`
   - `src/infra/database/prisma/repositories/prisma-answers-repository.ts`

2. Replace repetitive controller exception mapping with a shared error-to-HTTP strategy.
   Evidence:
   - `src/infra/http/controllers/create-account.controller.ts`
   - `src/infra/http/controllers/authenticate.controller.ts`
   - `src/infra/http/controllers/read-notification.controller.ts`

3. Add CI workflows for lint, build, unit, e2e, and coverage.
   Evidence:
   - `package.json`
   - repository scan found no `.github/workflows/*`

4. Add production observability: health endpoints, structured logs, metrics, tracing, error reporting.
   Evidence:
   - `src/infra/main.ts`
   - `src/infra/http/controllers/create-question.controller.ts`
   - repository scan found no health, metrics, tracing, or reporting modules

5. Remove debug logging from repositories and standardize logging policy.
   Evidence:
   - `src/infra/database/prisma/repositories/prisma-notifications-repository.ts`

6. Add edge security controls: CORS policy, security headers, rate limiting, auth abuse protection.
   Evidence:
   - repository scan found no CORS, `helmet`, throttle, or rate-limit configuration

7. Add onboarding docs and environment examples.
   Evidence:
   - repository scan found no `README.md`
   - repository scan found no `.env.example`

8. Decide whether `INSTRUCTOR` is real product scope or dead schema.
   Evidence:
   - `prisma/schema.prisma`
   - no controller or use-case behavior references the role
