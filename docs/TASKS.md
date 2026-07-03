# AI Backend Factory Task Plan

## 1. Source Context

- PRD: `docs/PRD.md`
- Project memory: `CONTEXT.md`
- ADRs:
  - `docs/adr/0001-forum-inspired-architecture.md`
  - `docs/adr/0002-deterministic-v1-generation.md`
  - `docs/adr/0003-single-process-v1.md`
  - `docs/adr/0004-domain-core-and-use-case-error-boundary.md`
- Architecture reference:
  - `forum-blueprint.md`
  - Most relevant sections: Tech Stack, Repository Structure, Architectural Style, Dependency Injection, Testing Strategy, Configuration and Environment, CI/CD and Quality Gates
- Existing repository areas:
  - Bootstrap infrastructure, env validation, and the health endpoint are implemented
  - Account, Generation Job, and notification entities plus Prisma-backed repositories are implemented
  - `PROJECT.md` exists and is the stable project handbook
  - No `docs/GLOSSARY.md` exists yet
  - Auth use cases/controllers, notification subscribers, and generation worker/event orchestration have not started yet

## 2. Implementation Goal

Create the first working version of AI Backend Factory as a forum-inspired NestJS modular monolith that lets authenticated users create and track asynchronous Generation Jobs, emits in-app notifications for job completion or failure, and deterministically generates a local backend Generic Foundation under the fixed Workspace Root.

## 3. Non-Goals

- Build a web UI
- Add OAuth, magic-link auth, or anonymous access
- Create remote GitHub repositories or provision external infrastructure
- Support multiple stack variants
- Use an LLM for v1 generation
- Generate domain-specific modules, entities, or business routes
- Add retry, cancellation, pause, or resume controls for Generation Jobs
- Deliver notifications by email, SMS, or push
- Split API and worker into separate deployables
- Auto-suffix duplicate project names
- Push `UniqueEntityID` objects through HTTP DTOs or Prisma records
- Return `Either` directly from entities or value objects

## 4. Acceptance Criteria Mapping

| Acceptance Criterion | Task(s) | Test(s) | Status |
| --- | --- | --- | --- |
| AC-1 Authenticated registration and login via JWT | T1, T2, T2A, T2B, T3 | unit, e2e | planned |
| AC-2 Authenticated job creation with `projectName`, `projectDescription`, `notes` | T2, T2A, T4 | unit, e2e | planned |
| AC-3 Persisted owner-backed jobs with `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED` | T2, T2A, T4, T7 | unit, integration | planned |
| AC-4 Users can list and fetch only their own jobs | T3, T4 | unit, e2e | planned |
| AC-5 Successful jobs create a local generated project and initialize Git | T6, T7 | integration | planned |
| AC-6 Jobs fail when target folder already exists | T7 | unit, integration | planned |
| AC-7 Generated service contains the agreed Generic Foundation | T1, T2A, T6, T7, T8 | integration, manual smoke | planned |
| AC-8 Factory Service follows the forum-inspired modular monolith style | T1, T2, T2A, T2B, T3, T4, T5, T7 | architecture review, unit, e2e | planned |
| AC-9 In-app notifications are stored for job completion or failure | T2, T2A, T5, T7 | unit, integration, e2e | planned |
| AC-10 Users can list notifications and mark one as read | T3, T5 | unit, e2e | planned |
| AC-11 Generation is deterministic, local, and does not call an LLM or create remote repos | T6, T7, T8 | integration, code review | planned |
| AC-12 No retry or cancellation API is exposed | T4, T7, T8 | e2e, route surface check | planned |
| AC-13 Factory-owned account and Generation Job code live under one bounded context | T2B | unit, integration | planned |

## 5. Task Breakdown

## T1 — Bootstrap The Factory Service Skeleton

Status: done

Objective:
Create the greenfield project foundation for the Factory Service using the blueprint-aligned stack and repository shape.

Affected files / areas:
- `package.json`
- `pnpm-lock.yaml`
- `tsconfig*.json`
- `nest-cli.json`
- `biome.json`
- `vitest.config*.ts`
- `.github/workflows/ci.yml`
- `docker-compose.yml`
- `.env.example`
- `README.md`
- `PROJECT.md`
- `client.http`
- `repos/.gitkeep`
- `src/core/**`
- `src/infra/app.module.ts`
- `src/infra/main.ts`
- `src/infra/env/**`
- `src/infra/http/controllers/health*`
- `test/**`

Test-first plan:
- Write a failing e2e smoke test for application boot and the baseline health endpoint.
- Write a failing configuration test that proves required environment variables are validated at startup.

Implementation notes:
- Match the blueprint stack directly: NestJS, Prisma, PostgreSQL, Redis, JWT, Biome, Vitest, Docker, GitHub Actions.
- Create the root `PROJECT.md` during this task because the repository is intended for continued reuse.
- Establish the top-level shape early: `src/core`, `src/domain`, `src/infra`, `prisma`, `test`.

Dependencies:
- None

Completion signal:
- The repo can install, boot, answer a health request, and run lint, unit, and e2e commands through documented scripts.

## T2 — Model Factory Domains And Persistence

Status: done

Objective:
Define the domain and persistence model for accounts, Generation Jobs, and notifications.

Affected files / areas:
- `prisma/schema.prisma`
- `prisma/migrations/**`
- `src/domain/factory/**`
- `src/domain/notification/**`
- `src/infra/database/**`
- `test/repositories/**`
- `test/factories/**`

Test-first plan:
- Write failing unit tests for account creation rules, Generation Job creation defaults, Generation State invariants, and notification read behavior.
- Write failing repository contract tests for owner-scoped queries and persisted job metadata.

Implementation notes:
- Use three bounded areas from the start: `account`, `factory`, and `notification`.
- Persist Generation Job metadata needed for later job detail reads, including owner, input, state, output path, failure details, and timestamps.
- Keep repository ports in the application layer and Prisma adapters in infrastructure, following the blueprint.

Dependencies:
- T1

Completion signal:
- Prisma schema, domain entities, repository ports, and Prisma adapters exist for the three core aggregates and support the read patterns required by the PRD.

## T2A — Introduce Shared Domain Core And Use-Case Error Boundaries

Status: done

Objective:
Add the shared DDD-lite core contract that both the Factory Service and Generated Services will follow, and refactor the current aggregates to use it before application use cases and controllers are added.

Affected files / areas:
- `src/core/entities/**`
- `src/core/events/**`
- `src/core/errors/**`
- `src/core/either.ts`
- `src/core/types/**`
- `src/domain/factory/enterprise/**`
- `src/domain/notification/enterprise/**`
- `src/infra/database/prisma/mappers/**`
- `src/infra/database/prisma/repositories/**`
- `test/factories/**`

Test-first plan:
- Write failing unit tests for `UniqueEntityID`, entity equality, aggregate domain-event collection, and typed domain invariant errors.
- Update current aggregate tests to assert the new id semantics and preserve the existing business behavior for email normalization, Generation Job state transitions, and notification read behavior.
- Write failing repository contract regressions that prove Prisma records and repository lookup methods still use strings while aggregates expose `UniqueEntityID` internally.

Implementation notes:
- Add `Entity`, `AggregateRoot`, `UniqueEntityID`, `ValueObject`, optional-type helpers, and minimal in-process domain-event infrastructure in `src/core`.
- Convert `Account`, `GenerationJob`, and `Notification` into aggregate roots and keep application/repository boundaries string-based.
- Add typed domain errors for invariant violations and add `Either` plus `UseCaseError` foundation for T3+ use cases without pushing `Either` into the domain layer.
- Prepare the same architectural contract for Generated Service templates, but do not implement template generation in this task.

Dependencies:
- T2

Completion signal:
- Current aggregates use the shared core primitives, persistence adapters preserve behavior across the new id boundary, and the repo contains the `Either`/`UseCaseError` foundation needed for T3 use cases.

## T2B — Consolidate Factory Domain Module Structure

Status: done

Objective:
Refactor the domain folder layout so account and Generation Job code live under the `factory` bounded context while preserving all existing runtime behavior, persistence contracts, and public API plans.

Affected files / areas:
- `src/domain/factory/**`
- `src/domain/account/**` to be moved or removed
- `src/infra/database/**`
- `test/factories/**`
- `src/**/*.spec.ts`
- `PROJECT.md`
- `CONTEXT.md`

Test-first plan:
- Move or update the existing domain and repository unit tests so they fail first against stale import paths.
- Re-run the current account, Generation Job, and Prisma repository tests to prove the structural refactor preserves behavior.
- Run typecheck and lint to catch missed import-path or module-boundary regressions.

Implementation notes:
- Keep the `factory` module as the single bounded context for Factory Authentication and Generation Job concepts.
- Keep `notification` as a separate bounded context.
- Preserve existing class names, repository interfaces, domain behavior, and Prisma mappings unless a path change requires otherwise.
- Do not change runtime behavior, HTTP contracts, Prisma schema, or env setup in this task.

Dependencies:
- T2A

Completion signal:
- Account and Generation Job code live under `src/domain/factory/**`, imports are updated, old `src/domain/account/**` paths are removed, and the current unit/repository validation still passes without behavior changes.

## T3 — Implement Authentication And Protected Access

Status: done

Objective:
Implement account registration, login, JWT issuance, and shared ownership-aware request access.

Affected files / areas:
- `src/domain/factory/application/use-cases/**`
- `src/domain/factory/application/cryptography/**`
- `src/infra/auth/**`
- `src/infra/cryptography/**`
- `src/infra/http/controllers/register*`
- `src/infra/http/controllers/authenticate*`
- `src/infra/http/pipes/**`
- `src/infra/http/presenters/**`
- `src/infra/http/http.module.ts`
- `src/**/*.e2e-spec.ts`

Test-first plan:
- Write failing unit tests for register and authenticate use cases.
- Write failing e2e tests for registration, login, invalid credentials, and unauthorized access to a protected route.

Implementation notes:
- Reuse the blueprint pattern for JWT guards, current-user decorators, bcrypt-based hashing, and request validation.
- Make protected-route ownership checks easy to reuse in later job and notification controllers.

Dependencies:
- T1, T2, T2A, T2B

Completion signal:
- Users can register and log in through the API, and protected routes can reliably resolve the authenticated Factory User.

## T4 — Implement Generation Job API Surface

Status: done

Objective:
Expose the authenticated REST contract for creating, listing, and fetching Generation Jobs.

Affected files / areas:
- `src/domain/factory/application/use-cases/create-generation-job.ts`
- `src/domain/factory/application/use-cases/list-user-generation-jobs.ts`
- `src/domain/factory/application/use-cases/get-generation-job-details.ts`
- `src/infra/http/controllers/create-generation-job*`
- `src/infra/http/controllers/list-generation-jobs*`
- `src/infra/http/controllers/get-generation-job*`
- `src/infra/http/presenters/generation-job*`
- `test/factories/make-generation-job.ts`
- `src/**/*.e2e-spec.ts`

Test-first plan:
- Write failing unit tests for job creation defaults, owner scoping, and detail fetch authorization.
- Write failing e2e tests for create, list, and get flows with cross-user access denial.

Implementation notes:
- Keep job creation synchronous at the API layer but asynchronous in execution: the endpoint should persist a `PENDING` job and return without doing the filesystem generation inline.
- Do not add retry or cancellation routes.

Dependencies:
- T2, T2A, T3

Completion signal:
- Authenticated users can create jobs and read only their own jobs through the API with correct initial state handling.

## T5 — Implement Notification Storage And Read API

Status: planned

Objective:
Expose in-app notifications and mark-as-read behavior for authenticated users.

Affected files / areas:
- `src/domain/notification/application/use-cases/list-notifications.ts`
- `src/domain/notification/application/use-cases/read-notification.ts`
- `src/domain/notification/application/subscribers/**`
- `src/infra/http/controllers/list-notifications*`
- `src/infra/http/controllers/read-notification*`
- `src/infra/http/presenters/notification*`
- `test/repositories/in-memory-notifications-repository.ts`
- `src/**/*.e2e-spec.ts`

Test-first plan:
- Write failing unit tests for listing notifications by owner, marking one notification as read, and rejecting cross-user reads.
- Write failing e2e tests for listing notifications and marking one notification as read.

Implementation notes:
- Follow the blueprint notification shape closely: notification persistence plus explicit read behavior.
- Wire notification creation off Generation Job terminal-state events rather than coupling it directly into controllers.

Dependencies:
- T2, T2A, T3, T4

Completion signal:
- Users can read and acknowledge their own notifications, and the notification module is ready to consume job lifecycle events.

## T6 — Author The Deterministic Generated-Service Template Pack

Status: planned

Objective:
Create the local blueprint-aligned template assets and assembly rules for the Generic Foundation that the factory will generate.

Affected files / areas:
- `templates/generated-service/**`
- `src/domain/factory/application/generation/**`
- `src/domain/factory/application/generation/template-manifest*`
- `test/generation/**`

Test-first plan:
- Write a failing integration-style test that verifies the template pack describes the expected baseline artifact set.
- Write failing tests that assert excluded scope, especially the absence of domain-specific business modules in v1 output.

Implementation notes:
- Prefer a clearly versioned local template tree over hidden string builders.
- The generated baseline should include: health behavior, auth module, notification module, Prisma schema, Redis wiring, Docker assets, GitHub Actions, tests, README, and `PROJECT.md`.
- Keep the generated architecture aligned with the blueprint without copying forum-specific business concepts.
- Include the same shared core primitives and use-case error boundary conventions adopted by the Factory Service.

Dependencies:
- T1

Completion signal:
- The repository contains a deterministic template pack and assembly rules that can be validated independently of job orchestration.

## T7 — Implement In-Process Generation Execution

Status: planned

Objective:
Run Generation Jobs asynchronously inside the Factory Service, generate the local project, initialize Git, and persist terminal job outcomes.

Affected files / areas:
- `src/domain/factory/application/use-cases/process-generation-job.ts`
- `src/domain/factory/application/services/**`
- `src/domain/factory/application/events/**`
- `src/infra/events/**`
- `src/infra/filesystem/**`
- `src/infra/process/**`
- `src/infra/database/prisma/repositories/prisma-generation-jobs-repository.ts`
- `src/**/*.spec.ts`
- `src/**/*.e2e-spec.ts`

Test-first plan:
- Write failing integration tests for `PENDING -> RUNNING -> SUCCEEDED` and duplicate-path `FAILED` flows.
- Write failing integration tests for workspace-root enforcement, Git initialization, and persisted output metadata.
- Write failing tests that verify terminal state events trigger notification creation.

Implementation notes:
- Keep execution in the same NestJS process, but isolate the worker logic behind application services and ports so it can be extracted later if needed.
- Use the fixed Workspace Root only; do not honor a client-provided path.
- Normalize `projectName` into a safe filesystem slug for directory creation while preserving the original value as job metadata.
- Avoid partially-created final directories on failure; prefer staging work in a temporary area and moving it into place only after the generated tree is complete.
- A duplicate final directory should produce a `FAILED` job, not an alternate path.

Dependencies:
- T2, T2A, T4, T5, T6

Completion signal:
- Newly created jobs are processed asynchronously, create local projects under the workspace root, initialize Git, persist success or failure details, and emit terminal events.

## T8 — Finalize Operational Quality Gates And Output Verification

Status: planned

Objective:
Harden the repo so both the Factory Service and the generated baseline are verifiable through local and CI workflows.

Affected files / areas:
- `.github/workflows/ci.yml`
- `README.md`
- `PROJECT.md`
- `client.http`
- `test/setup-e2e.ts`
- `test/generation/**`
- `scripts/**` if needed for verification

Test-first plan:
- Add failing automation-oriented tests or checks that verify the generated output inventory and the primary authenticated API flow together.
- Add failing CI workflow validation if the command set is incomplete.

Implementation notes:
- Ensure the quality gate runs lint, typecheck, unit, integration, and e2e coverage appropriate to the final scaffold.
- Document known v1 limitations explicitly, especially one-shot generation and same-process worker boundaries.
- Keep generated-service verification in automated checks so template drift is caught early.

Dependencies:
- T1, T3, T4, T5, T6, T7

Completion signal:
- CI, docs, and automated checks validate both the Factory Service behavior and the deterministic generated output.

## 6. Test Strategy

- Unit tests:
  - Core entity/id primitives, aggregate event collection, and typed domain invariant errors
  - Domain-module structure regressions for account and Generation Job imports
  - Account registration and authentication use cases
  - Generation Job creation rules, state handling, ownership checks, and duplicate-path decisions
  - Notification listing and read behavior
  - Template manifest and generation-planning logic
- Integration tests:
  - Prisma-backed repository behavior for accounts, jobs, and notifications
  - Prisma/domain id mapping across the `UniqueEntityID` boundary
  - In-process generation execution against the real workspace root contract
  - Filesystem generation, Git initialization, and terminal-state persistence
  - Notification creation from job lifecycle events
- E2E tests:
  - Registration and login
  - Protected-route rejection
  - Create/list/get generation jobs
  - List/read notifications
  - End-to-end successful job flow from API request to persisted job terminal state
- Edge cases to cover:
  - Duplicate project name collision
  - Cross-user access to jobs or notifications
  - Invalid Generation Request payloads
  - Unsafe or non-normalizable project names
  - Worker failure paths that should produce `FAILED`
- Expected commands:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm test:e2e`
  - `pnpm typecheck`
  - `pnpm prisma migrate dev`
  - `docker compose up -d postgres redis`
- Safest validation alternative if a full e2e path is temporarily blocked:
  - Run integration tests against Prisma plus filesystem generation, then manually exercise the HTTP endpoints with `client.http`

## 7. Risk Plan

- Filesystem safety:
  - Risk: unsafe `projectName` values can create invalid or dangerous local paths.
  - Mitigation: normalize to a safe slug, reject invalid names, and test path handling explicitly.
- Partial project output:
  - Risk: failures during generation can leave broken directories behind.
  - Mitigation: generate in a temporary staging directory and move into the final target only after assembly succeeds.
- Same-process worker reliability:
  - Risk: a process crash can leave jobs stranded in `PENDING` or `RUNNING`.
  - Mitigation: keep the worker isolated, persist state transitions carefully, and document the limitation in v1.
- Template drift from blueprint:
  - Risk: generated output diverges from the intended architecture over time.
  - Mitigation: keep template assets local, review them like source code, and verify the expected output inventory in tests.
- Auth and ownership regressions:
  - Risk: jobs or notifications leak across users.
  - Mitigation: implement owner-scoped repository queries and add explicit cross-user e2e coverage.
- Architecture drift across factory and generated services:
  - Risk: the Factory Service adopts core modeling patterns that the generated baseline does not, creating blueprint drift.
  - Mitigation: encode the shared core primitives and `Either` boundary in both the ADR and T6 template requirements before template generation starts.
- Domain layout drift:
  - Risk: per-entity folders outside the Factory bounded context reappear and make later application-layer work harder to navigate.
  - Mitigation: move account and Generation Job code under `src/domain/factory/**` before T3 and keep the task plan and project docs aligned with that boundary.
- CI flakiness:
  - Risk: Prisma, Redis, and filesystem-based tests become slow or inconsistent.
  - Mitigation: keep unit tests dominant, scope e2e coverage to the public contract, and isolate workspace directories per test run.

## 8. Execution Order

1. T1 to establish the factory scaffold, test harness, env handling, and health baseline.
2. T2 to lock the domain and persistence model before controller work begins.
3. T2A to install the shared domain core and `Either` foundation before new use cases and controllers are written.
4. T2B to align the Factory bounded context folder layout before new application use cases and controllers depend on those paths.
5. T3 to establish account access and reusable protected-route behavior.
6. T4 to expose job creation and job reads with owner scoping.
7. T5 to expose notification reads and prepare event-driven notification handling.
8. T6 to build the deterministic generated-service template pack independently of async execution.
9. T7 to wire the in-process worker, filesystem generation, Git initialization, state transitions, and terminal events together.
10. T8 to tighten CI, docs, and generated-output verification after the core behavior works.

## 9. Open Questions

No blocking open questions.

Planning assumptions:
- The generated directory name is derived from a safe slug of `projectName`, while the original `projectName` remains visible in stored job metadata.
- Meaningful lifecycle notifications in v1 include at least `SUCCEEDED` and `FAILED`.

## 10. Handoff to tdd

Ready for `tdd`.

Start with T3 and write the failing registration and authentication tests described in the test-first plan.
