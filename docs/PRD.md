## Problem Statement

Teams do not want a backend repo that only looks structurally correct. They want a Generated Service that already contains meaningful domain content for the product they described and is easy to continue after the first generation pass. Today AI Backend Factory can create a blueprint-aligned baseline, but the generated repository memory and planning artifacts are still too thin for guarded Codex work to consistently produce the best serious first version of that backend. A Factory User should be able to submit a Generation Request with a project name, project description, and notes, then receive a local Continuation-Ready Generated Service that includes the proven backend foundation, generated project memory, a generated PRD, an execution-ready feature plan, and a working domain slice derived from that request.

## Solution

Build AI Backend Factory as a REST-only Factory Service that keeps the existing authenticated Generation Job workflow but upgrades generation into three stages. The Factory Service first bootstraps a baseline repository under the fixed Workspace Root. It then creates the generated repository planning pack by synthesizing request-shaped `CONTEXT.md`, `docs/PRD.md`, and a single `features/<slug>.md` scope on top of the repo-local instructions and project handbook, using recommended defaults when the brief is underspecified instead of stopping for user interaction. After those planning artifacts exist, it initializes git, creates an initial baseline commit, and invokes a guarded local Codex runner against that generated repository until the selected feature scope has no ready tasks remaining or reaches the continuation-ready quality bar. If Codex orchestration is unavailable or fails, the Generation Job fails instead of falling back to a thin scaffold.

## User Stories

1. As a new Factory User, I want to register an account with email and password, so that I can create and own Generation Jobs.
2. As a Factory User, I want to authenticate with email and password and receive JWT-based API access, so that I can securely use the Factory API.
3. As a Factory User, I want to submit a Generation Request with a project name, project description, and notes, so that the Factory Service can generate a backend aligned to my intended product.
4. As a Factory User, I want the `notes` field to influence the generated backend content, so that I can steer the generated domain slice with extra constraints and emphasis.
5. As a Factory User, I want every Generated Service to follow one Opinionated Stack, so that the output is reliable and consistent.
6. As a Factory User, I want the Generated Service to be based on the Blueprint, so that I receive a backend shaped like the proven forum-inspired architecture instead of an arbitrary scaffold.
7. As a Factory User, I want Generation Jobs to run asynchronously, so that API requests stay responsive while generation work continues.
8. As a Factory User, I want to see whether my Generation Job is `PENDING`, `RUNNING`, `SUCCEEDED`, or `FAILED`, so that I can track its progress.
9. As a Factory User, I want to list only my own Generation Jobs, so that I can manage my work without seeing other users' data.
10. As a Factory User, I want to fetch one of my Generation Jobs by id, so that I can inspect its current state and generation result.
11. As a Factory User, I want the Factory Service to fail a Generation Job when the target project folder already exists, so that the output path stays deterministic and safe.
12. As a Factory User, I want the Factory Service to create Generated Services under a fixed Workspace Root, so that the local generation flow is predictable.
13. As a Factory User, I want the Factory Service to initialize Git inside the Generated Service and create an initial baseline commit, so that the guarded generation workflow can run from a clean repository state.
14. As a Factory User, I want the Generated Service baseline to include health, authentication, notifications, persistence, caching, Docker, CI, tests, documentation, and generated-repository workflow files, so that the domain-specific generation starts from a real backend workspace.
15. As a Factory User, I want the Generated Service to include at least one working domain slice derived from my request, so that I receive a usable backend service rather than only a generic baseline.
16. As a Factory User, I want that working domain slice to include real domain language, an aggregate root, supporting entities or value objects where the domain needs them, persistence, use cases, controllers, and tests, so that the output behaves like a proper backend service.
17. As a Factory User, I want the Factory Service to generate request-shaped `CONTEXT.md` for the requested backend, so that the generated repo has domain vocabulary, workflows, invariants, and assumptions before implementation begins.
18. As a Factory User, I want the Factory Service to generate repo-local `docs/PRD.md` for the requested backend, so that the generated repo has explicit scope and validation expectations before guarded implementation starts.
19. As a Factory User, I want the Factory Service to generate a repo-local feature scope file for the requested backend from that PRD, so that the guarded Codex runner has a constrained and execution-ready plan to complete.
20. As a Factory User, I want the Factory Service to use recommended default answers when my brief leaves normal discovery questions underspecified, so that generation does not block on an interactive interview.
21. As a Factory User, I want unresolved uncertainty captured as assumptions in the generated repository instead of hidden inside prompts, so that I can continue safely after generation.
22. As a Factory User, I want the Factory Service to keep running guarded Codex work until that generated-repository feature scope is done or the repo is continuation-ready, so that one Factory Generation Job corresponds to one strong first backend outcome.
23. As a Factory User, I want the Factory Service to fail the Generation Job if guarded Codex execution is unavailable or fails, so that I do not mistake a partial scaffold for a finished backend.
24. As a Factory User, I want the Factory Service to store an in-app Generation Notification when a Generation Job reaches a meaningful lifecycle event, so that I can see outcomes without relying only on polling.
25. As a Factory User, I want to list my Generation Notifications through the API, so that a future UI can present them.
26. As a Factory User, I want to mark a Generation Notification as read, so that I can manage notification state over time.
27. As a Factory User, I want ownership enforced on jobs and notifications, so that my account only sees its own resources.
28. As a maintainer, I want the Factory Service and Generated Services to share the same architectural style, so that the factory can dogfood the same conventions it produces.
29. As a maintainer, I want the generated repository to be continuation-ready rather than pretending to be a perfect final backend, so that success criteria stay realistic and useful.
30. As a maintainer, I want the HTTP API and generation worker to run in one application process, so that local setup and deployment stay simple.
31. As a maintainer, I want the factory to avoid retry and cancellation behavior in this phase, so that the Generation State model stays small and stable.
32. As a maintainer, I want account and Generation Job code grouped under one Factory bounded context, so that the domain structure follows the module boundary instead of fragmenting by entity.
33. As a maintainer, I want new implementation scopes in this repository to live under `features/<slug>.md`, so that long-lived upgrades do not overload the legacy `docs/TASKS.md` plan.

## Implementation Decisions

- The Factory Service remains a NestJS-based modular monolith that mirrors the domain, application, infrastructure, and test separation described by the Blueprint.
- The `factory` bounded context owns account and Generation Job code, while `notification` remains a separate bounded context.
- Generated Services use the same forum-inspired architectural style as the Factory Service rather than a different internal shape.
- The Factory Service and Generated Services share the same DDD-lite core primitives: `Entity`, `AggregateRoot`, `UniqueEntityID`, `ValueObject`, and in-process domain-event support.
- The Factory API remains REST-only. No web UI is part of this repository in this phase.
- Factory Authentication follows self-registration, email and password login, and JWT-protected routes.
- Application use cases return `Either<UseCaseError, Result>` and controllers translate `UseCaseError` values to HTTP responses explicitly through a shared mapper.
- Domain entities and value objects keep direct creation and mutation APIs, enforce invariants with typed domain errors, and do not depend on `Either` or HTTP-facing error contracts.
- The Factory API surface remains limited to account registration, session login, create generation job, list own jobs, get one job, list notifications, and mark one notification as read.
- Generation remains asynchronous and represented by Generation Jobs with the state set `PENDING`, `RUNNING`, `SUCCEEDED`, and `FAILED`.
- The HTTP API and background generation worker live in the same deployable NestJS application process.
- The Generation Request is structured and does not accept a client-chosen output directory.
- The Factory Service writes Generated Services into the fixed Workspace Root at `/home/matthew/personal/ai-backend-factory/repos`.
- A Generation Job fails when its target project folder already exists. Automatic suffixing is explicitly deferred.
- Generation is a three-stage flow: deterministic baseline bootstrap, generated repository planning-pack synthesis, then guarded Codex generation inside the generated repository.
- The deterministic baseline is a seed, not the final product. Success means a continuation-ready generated backend rather than only copying baseline files or pretending the backend is fully finished.
- The Factory Service must write generated-repository control files before invoking Codex, including `AGENTS.md`, `WORKFLOW.md`, a project-specific `PROJECT.md`, generated `CONTEXT.md`, generated `docs/PRD.md`, and a single `features/<slug>.md` scope derived from `projectName`, `projectDescription`, and `notes`.
- The generated planning pack must be synthesized without blocking on interactive user questioning. When the request is underspecified, the factory should choose recommended defaults and record them as assumptions in the generated repository.
- The Factory Service must create an initial git commit in the Generated Service before invoking the guarded runner because the runner requires a clean checkout.
- Guarded Codex execution is mandatory for backend content generation. If the local Codex runtime or guarded runner cannot execute successfully, the Factory Generation Job fails and must not silently fall back to a baseline-only scaffold.
- Every Generated Service uses one Opinionated Stack derived from the Blueprint instead of allowing stack selection per request.
- The Generated Service baseline includes at least health check behavior, user authentication, notification capabilities, Prisma with PostgreSQL, Redis wiring, Docker assets, GitHub Actions, linting, formatting, type checking, tests, project documentation, and generated-repository workflow files.
- A successful Generated Service must also include generated project memory, an execution-ready plan, and at least one working domain slice derived from the request, with real business language, an aggregate root, supporting entities or value objects where needed, persistence, use cases, controllers, and tests.
- The guarded implementation loop for generated repositories should consume documents in this order: `PROJECT.md -> CONTEXT.md -> docs/PRD.md -> features/<slug>.md -> tdd`.
- The Factory Service stores Generation Notifications in-app and exposes them through the API. Email delivery is out of scope.
- Meaningful generation metadata must be persisted so the Factory User can inspect job results and the created project details later.

## Acceptance Criteria

1. A new user can register an account and authenticate through the Factory API using email, password, and JWT-based access.
2. An authenticated Factory User can create a Generation Job by submitting a Generation Request with `projectName`, `projectDescription`, and `notes`.
3. A created Generation Job is persisted with an owner and progresses only through the Generation State set: `PENDING`, `RUNNING`, `SUCCEEDED`, and `FAILED`.
4. An authenticated Factory User can list only their own Generation Jobs and fetch only their own Generation Job details.
5. A successful Generation Job creates a local Generated Service inside the fixed Workspace Root, synthesizes generated repository planning artifacts for that project, initializes Git in that generated project, and creates an initial baseline commit before guarded Codex execution begins.
6. A Generation Job fails when the target project folder already exists.
7. A successful Generated Service contains the agreed baseline aligned with the Blueprint and the Opinionated Stack, including health, authentication, notifications, PostgreSQL/Prisma, Redis, Docker, CI, tests, documentation, and generated-repository workflow files.
8. A successful Generated Service contains generated `CONTEXT.md`, generated `docs/PRD.md`, and a generated `features/<slug>.md` scope that are materially shaped by `projectDescription` and `notes`.
9. A successful Generated Service contains at least one working domain slice derived from `projectDescription` and `notes`, including an aggregate root, supporting entities or value objects as needed, persistence, use cases, HTTP routes, and tests.
10. The Factory Service invokes guarded Codex orchestration against the generated repository only after the generated planning pack exists and until the selected `features/<slug>.md` scope has no ready tasks remaining or the continuation-ready quality bar is met.
11. The Factory Service fails the Generation Job when guarded Codex orchestration is unavailable or fails, and it does not fall back to a template-only scaffold.
12. The Factory Service itself follows the same forum-inspired modular monolith style used for Generated Services.
13. The Factory Service stores an in-app Generation Notification when a Generation Job reaches a meaningful lifecycle event such as completion or failure.
14. An authenticated Factory User can list their own notifications and mark one notification as read.
15. The repository groups account and Generation Job domain/application code under the Factory bounded context without changing runtime behavior, persistence shape, or public API contracts.
16. This repository uses `features/<slug>.md` for new active upgrade scopes instead of extending the legacy `docs/TASKS.md` file.

## Testing Decisions

- Good tests verify external behavior and observable outcomes rather than implementation details such as private methods, internal class composition, or prompt text internals.
- The primary seams are the authenticated REST API, the Generation Job orchestration flow, the baseline repository bootstrapper, the planning-pack synthesizer, and the guarded Codex runner invocation contract.
- Unit tests should cover pure decision logic such as Generation State transitions, request validation rules, safe project slug generation, ownership rules, feature-scope bootstrap decisions, and failure-reason mapping.
- Unit tests should also cover core entity/id primitives, typed domain invariant errors, aggregate event collection, and use-case `Either` result handling.
- Integration tests should cover use cases that cross boundaries, especially account registration and login, job creation and retrieval, notification creation and read flows, persistence-backed orchestration, baseline repository bootstrap, planning-pack synthesis, and guarded runner process invocation with fakes or test doubles.
- Filesystem-oriented integration tests should verify that successful generation creates the expected local project structure, writes the generated-repository workflow files plus planning artifacts, initializes git, creates the initial baseline commit, and persists output metadata under the Workspace Root.
- End-to-end API tests should verify the public contract for the generation endpoints using authenticated requests and realistic persistence wiring, including both success and guarded-runner failure outcomes.
- Repository mapping tests should verify that domain ids stay as `UniqueEntityID` inside aggregates while Prisma records and application lookup methods continue using strings at the boundary.
- Since the repository is already using a thin-controller, use-case-driven style, prior art remains controller-level e2e tests, use-case unit tests, and adapter-focused infrastructure tests.
- Tests should explicitly cover failure behavior for duplicate project names, missing or failing Codex orchestration, unauthorized requests, and ownership violations on jobs and notifications.

## Out of Scope

- Web UI or dashboard inside this repository.
- OAuth, magic-link authentication, anonymous access, or external identity providers.
- Remote GitHub repository creation, pushes, pull requests, or external infrastructure provisioning.
- Client-selected output directories.
- Multiple backend stack variants or stack selection by request.
- Automatic generation of multiple independent feature scopes per Generation Job.
- Job retry, cancellation, pause, resume, or advanced workflow controls.
- Email, push, or SMS notification delivery.
- Multi-process or distributed worker deployment.
- Automatic suffixing for duplicate project names.

## Validation Expectations

- The Factory Service must be verifiable through automated tests that exercise the API, job orchestration, notification behavior, baseline repository bootstrap, and guarded Codex invocation flow.
- The generated project structure must be validated against the agreed baseline and the Blueprint-aligned Opinionated Stack.
- Successful generation must be validated by checking that the Generated Service exists under the Workspace Root, includes git initialization plus an initial baseline commit, includes the generated-repository workflow files and planning artifacts, and contains the expected domain-specific backend artifacts after guarded Codex execution completes.
- Failure paths must be validated for duplicate names, guarded-runner unavailability or failure, unauthorized requests, and cross-user resource access.

## Further Notes

- The `notes` field is now part of the backend generation contract, not only generation metadata.
- The generated baseline should include the same core domain primitives and use-case error boundary conventions adopted by the Factory Service.
- `forum-blueprint.md` remains the primary engineering guide for both the Factory Service and the Generated Service architecture.
