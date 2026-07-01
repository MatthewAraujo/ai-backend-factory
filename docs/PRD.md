## Problem Statement

Teams repeatedly need a strong backend starting point, but rebuilding the same foundational stack and project structure by hand is slow and inconsistent. AI Backend Factory should let an authenticated user submit a structured Generation Request and receive a local Generated Service that already follows the proven architectural style in `forum-blueprint.md`, so the user can keep building from a reliable base instead of starting from scratch.

## Solution

Build AI Backend Factory as a REST-only Factory Service that follows the same forum-inspired modular monolith architecture it generates. A Factory User can self-register, authenticate with email and password, submit a Generation Request, and track an asynchronous Generation Job. The Factory Service processes the job in the same application process, creates a local project under the fixed Workspace Root, initializes Git in the generated project, writes a deterministic Generic Foundation based on the Blueprint, persists job state, and stores in-app Generation Notifications for meaningful lifecycle events.

## User Stories

1. As a new Factory User, I want to register an account with email and password, so that I can create and own Generation Jobs.
2. As a Factory User, I want to authenticate with email and password and receive JWT-based API access, so that I can securely use the Factory API.
3. As a Factory User, I want to submit a Generation Request with a project name, project description, and notes, so that the Factory Service can create a Generated Service for my intended backend.
4. As a Factory User, I want every Generated Service in v1 to follow one Opinionated Stack, so that the output is reliable and consistent.
5. As a Factory User, I want the Generated Service to be based on the Blueprint, so that I receive a backend foundation shaped like the proven forum architecture instead of an arbitrary scaffold.
6. As a Factory User, I want Generation Jobs to run asynchronously, so that API requests stay responsive while generation work continues.
7. As a Factory User, I want to see whether my Generation Job is `PENDING`, `RUNNING`, `SUCCEEDED`, or `FAILED`, so that I can track its progress.
8. As a Factory User, I want to list only my own Generation Jobs, so that I can manage my work without seeing other users' data.
9. As a Factory User, I want to fetch one of my Generation Jobs by id, so that I can inspect its current state and generation result.
10. As a Factory User, I want the Factory Service to fail a Generation Job when the target project folder already exists, so that the output path stays deterministic and safe.
11. As a Factory User, I want the Factory Service to create Generated Services under a fixed Workspace Root, so that the local generation flow is predictable in v1.
12. As a Factory User, I want the Factory Service to initialize Git inside the Generated Service, so that I can continue development from an already versioned project.
13. As a Factory User, I want the Generated Service to include health, authentication, notifications, persistence, caching, Docker, CI, tests, and documentation, so that I receive a strong backend foundation instead of a minimal skeleton.
14. As a Factory User, I want the Generated Service to exclude business-domain modules in v1, so that the factory delivers a reliable Generic Foundation before domain-specific generation exists.
15. As a Factory User, I want the Factory Service to store an in-app Generation Notification when a Generation Job reaches a meaningful lifecycle event, so that I can see outcomes without relying only on polling.
16. As a Factory User, I want to list my Generation Notifications through the API, so that a future UI can present them.
17. As a Factory User, I want to mark a Generation Notification as read, so that I can manage notification state over time.
18. As a Factory User, I want ownership enforced on jobs and notifications, so that my account only sees its own resources.
19. As a maintainer, I want deterministic local generation instead of freeform LLM file synthesis in v1, so that output stays testable, repeatable, and aligned with the Blueprint.
20. As a maintainer, I want the Factory Service and Generated Services to share the same architectural style, so that the factory can dogfood the same conventions it produces.
21. As a maintainer, I want the HTTP API and generation worker to run in one application process in v1, so that local setup and deployment stay simple.
22. As a maintainer, I want the factory to avoid retry and cancellation behavior in v1, so that the first release can keep the Generation State model small and stable.

## Implementation Decisions

- The Factory Service is a NestJS-based modular monolith that mirrors the domain, application, infrastructure, and test separation described by the Blueprint.
- Generated Services use the same forum-inspired architectural style as the Factory Service rather than a different internal shape.
- The v1 Factory API is REST-only. No web UI is part of this repository in the first release.
- Factory Authentication follows self-registration, email and password login, and JWT-protected routes.
- The Factory API surface for v1 is limited to account registration, session login, create generation job, list own jobs, get one job, list notifications, and mark one notification as read.
- Generation is asynchronous and represented by Generation Jobs with the v1 state set `PENDING`, `RUNNING`, `SUCCEEDED`, and `FAILED`.
- The HTTP API and background generation worker live in the same deployable NestJS application process in v1.
- The Generation Request is structured and v1 does not accept a client-chosen output directory.
- The Factory Service writes Generated Services into the fixed Workspace Root at `/home/matthew/personal/ai-backend-factory/repos`.
- A Generation Job fails when its target project folder already exists. Automatic suffixing is explicitly deferred.
- V1 generation is deterministic and local, using blueprint-aligned templates and assembly rules instead of LLM-based file generation.
- V1 output is a Generic Foundation only. Domain-specific modules, entities, business routes, and custom schema generation are deferred to a later phase of the creation flow.
- Every Generated Service uses one Opinionated Stack derived from the Blueprint instead of allowing stack selection per request.
- The Generated Service baseline includes at least health check behavior, user authentication, notification capabilities, Prisma with PostgreSQL, Redis wiring, Docker assets, GitHub Actions, linting, formatting, type checking, tests, and project documentation.
- The Factory Service stores Generation Notifications in-app and exposes them through the API. Email delivery is out of scope for v1.
- Git initialization is part of successful Generated Service creation.
- Meaningful generation metadata must be persisted so the Factory User can inspect job results and the created project details later.

## Acceptance Criteria

1. A new user can register an account and authenticate through the Factory API using email, password, and JWT-based access.
2. An authenticated Factory User can create a Generation Job by submitting a Generation Request with `projectName`, `projectDescription`, and `notes`.
3. A created Generation Job is persisted with an owner and progresses only through the v1 Generation State set: `PENDING`, `RUNNING`, `SUCCEEDED`, and `FAILED`.
4. An authenticated Factory User can list only their own Generation Jobs and fetch only their own Generation Job details.
5. A successful Generation Job creates a local Generated Service inside the fixed Workspace Root and initializes Git in that generated project.
6. A Generation Job fails when the target project folder already exists.
7. A successful Generated Service contains the agreed Generic Foundation aligned with the Blueprint and the Opinionated Stack, including health, authentication, notifications, PostgreSQL/Prisma, Redis, Docker, CI, tests, and documentation.
8. The Factory Service itself follows the same forum-inspired modular monolith style used for Generated Services.
9. The Factory Service stores an in-app Generation Notification when a Generation Job reaches a meaningful lifecycle event such as completion or failure.
10. An authenticated Factory User can list their own notifications and mark one notification as read.
11. V1 generation is deterministic, local, and does not call an LLM or create remote repositories.
12. V1 does not expose retry or cancellation behavior for Generation Jobs.

## Testing Decisions

- Good tests verify external behavior and observable outcomes rather than implementation details such as private methods, internal class composition, or template helper internals.
- The primary seams are the authenticated REST API, the generation orchestration flow, and the deterministic filesystem generator.
- Unit tests should cover pure decision logic such as Generation State transitions, request validation rules, name collision handling, ownership rules, and generation planning logic.
- Integration tests should cover use cases that cross boundaries, especially account registration and login, job creation and retrieval, notification creation and read flows, and persistence-backed orchestration.
- Filesystem-oriented integration tests should verify that successful generation creates the expected local project structure, initializes Git, and writes baseline configuration and documentation files under the Workspace Root.
- End-to-end API tests should verify the public contract for the v1 endpoints using authenticated requests and realistic persistence wiring.
- Since the repository is greenfield, the prior art is the Blueprint approach: thin controllers, use-case-driven application logic, infrastructure adapters behind ports, unit tests around use cases, and controller-level end-to-end tests with real application wiring.
- Tests should explicitly cover failure behavior for duplicate project names, unauthorized access, and ownership violations on jobs and notifications.

## Out of Scope

- Web UI or dashboard inside this repository.
- OAuth, magic-link authentication, anonymous access, or external identity providers.
- Remote GitHub repository creation, pushes, pull requests, or external infrastructure provisioning.
- Client-selected output directories.
- Multiple backend stack variants or stack selection by request.
- LLM-driven code generation in v1.
- Domain-specific module, entity, route, or business-schema generation.
- Job retry, cancellation, pause, resume, or advanced workflow controls.
- Email, push, or SMS notification delivery.
- Multi-process or distributed worker deployment in v1.
- Automatic suffixing for duplicate project names.

## Validation Expectations

- The Factory Service must be verifiable through automated tests that exercise the v1 API, job orchestration, notification behavior, and local filesystem generation flow.
- The generated project structure must be validated against the agreed Generic Foundation and the Blueprint-aligned Opinionated Stack.
- Successful generation must be validated by checking that the Generated Service exists under the Workspace Root, includes Git initialization, and contains the expected baseline artifacts.
- Failure paths must be validated for duplicate names, unauthorized requests, and cross-user resource access.

## Further Notes

- Future phases may add domain-specific generation on top of the Generic Foundation instead of replacing the v1 deterministic baseline.
- Future enhancements may include duplicate-name suffixing, external notification channels, multi-process workers, remote repository provisioning, and LLM-assisted generation steps.
- `forum-blueprint.md` remains the primary engineering guide for both the Factory Service and the Generated Service architecture.
