# AI Backend Factory

This context defines the product vocabulary for AI Backend Factory. It exists to keep planning and implementation aligned on what the factory itself produces and what the generated output represents.

## Language

**Factory Service**:
The backend application in this repository that accepts user needs and generates backend starter projects.
_Avoid_: generator, template repo, scaffold app

**Factory API**:
The REST API exposed by the Factory Service to submit and track Generated Service creation work.
_Avoid_: web app, dashboard, admin panel

**Factory User**:
An authenticated account that can create, own, and track multiple Generation Jobs and Generated Services and receive Generation Notifications.
_Avoid_: visitor, operator only, anonymous client

**Factory Authentication**:
The v1 account access model based on self-registration, email and password login, and JWT-protected API routes.
_Avoid_: magic link, OAuth only, anonymous access

**Generation Job**:
A unit of asynchronous work that turns a user request into a Generated Service over one or more processing steps.
_Avoid_: request, task runner, workflow instance

**Generation Request**:
The structured input submitted to the Factory API to describe the Generated Service to be created, including project metadata and free-text notes but not a client-chosen output path in v1.
_Avoid_: prompt only, raw message, unstructured brief

**Generation State**:
The current lifecycle status of a Generation Job, limited in v1 to `PENDING`, `RUNNING`, `SUCCEEDED`, and `FAILED`, and used by API clients to track progress and later support a UI.
_Avoid_: page state, session state, frontend state

**Generation Notification**:
A user-facing notification emitted by the Factory Service when a Generation Job reaches a meaningful lifecycle event such as completion, stored in-app and read through the API in v1.
_Avoid_: log entry, internal event, toast only

**Generated Service**:
The backend service produced by the Factory Service for a specific user request, including both the reusable baseline and at least one generated business-domain slice.
_Avoid_: clone, repo, app

**Continuation-Ready Generated Service**:
A Generated Service that is not expected to be the final backend, but is strong enough for a user or a later guarded Codex run to continue safely. It includes the baseline stack, project memory, a generated PRD, an execution plan, and at least one meaningful domain slice shaped by the request.
_Avoid_: finished product, throwaway scaffold, perfect one-shot backend

**Workspace Root**:
The fixed local directory where the Factory Service creates Generated Services in v1, under `/home/matthew/personal/ai-backend-factory/repos`.
_Avoid_: per-request output path, arbitrary filesystem target, user-selected destination

**Generation Baseline**:
The reusable backend starting point produced before domain-specific Codex generation begins. It provides the stack, shared primitives, workflow files, and seed structure that the generated service builds on.
_Avoid_: final product, full implementation, finished backend

**Feature Scope File**:
The generated-repository task plan stored as `features/<slug>.md` that defines the single backend scope the guarded Codex runner must complete.
_Avoid_: backlog, roadmap, arbitrary notes file

**Opinionated Stack**:
The single approved backend technology combination used by v1 for every Generated Service, derived from the Blueprint rather than selected per request.
_Avoid_: stack options, presets, variants

**Blueprint**:
The primary architectural reference that guides how the Factory Service and each Generated Service should be structured without copying a source system verbatim.
_Avoid_: template, starter code, boilerplate dump

**Guarded Codex Generation**:
The generation phase where the Factory Service invokes a local guarded Codex runner against the generated repository until the selected Feature Scope File has no ready tasks remaining.
_Avoid_: manual follow-up, template-only generation, one-shot prompt dump

**Working Domain Slice**:
The minimum acceptable domain-specific backend implementation produced for a Generated Service: one bounded context with real domain language, at least one aggregate root, supporting entities or value objects as needed, persistence, use cases, HTTP endpoints, and tests.
_Avoid_: placeholder module, empty controller, fake sample code

**One-shot Generation**:
The v1 execution model where a Generation Job can be created and tracked but not cancelled or retried through the API.
_Avoid_: workflow control, retryable orchestration, cancellable runs

## Implementation Discoveries

- The Factory bounded context owns both account and Generation Job domain/application code. The `notification` context remains separate because it models user-facing lifecycle messages rather than Factory Authentication or job execution state directly.
- The Factory Service and the Generated Service baseline should share the same DDD-lite core contract: `Entity`, `AggregateRoot`, `UniqueEntityID`, `ValueObject`, and in-process domain-event support in `src/core`.
- `Either` belongs at the application/use-case boundary, not inside entities or value objects. Domain objects should keep direct factory/update APIs and raise typed domain errors for invariant violations.
- Application-layer request DTOs, repository lookup methods, Prisma adapters, and HTTP presenters should continue to exchange plain string ids at the boundary. Conversion to and from `UniqueEntityID` belongs inside domain objects and mappers.
- Controllers should translate `UseCaseError` results explicitly with a shared mapper to Nest HTTP exceptions rather than hiding the mapping behind a generic wrapper early.

- Bootstrap environments may leave `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` blank before T3. The env parser should normalize blank values to `undefined` so the service can boot before authentication is implemented.
- Nest constructor injection in the Vitest runtime should use explicit `@Inject(...)` parameter decorators for providers used in e2e tests. This avoids relying on constructor metadata that the test transform may not preserve consistently.
- Prisma repository adapters are intentionally typed against the small delegate surface they use. This keeps adapter contract tests fast with a fake Prisma client while preserving the Prisma-backed persistence boundary for later tasks.
- Backend generation cannot stop at the baseline template. A Factory User expects the Generated Service to include meaningful domain content shaped by `projectDescription` and `notes`, not only matching folders and placeholder files.
- The Generation Request `notes` field is part of the generation contract. It must influence the generated business-domain scope instead of being stored only as metadata.
- A successful Generation Job now requires two phases: baseline repository bootstrap by the Factory Service, then guarded Codex execution inside that repository until its selected Feature Scope File is complete.
- The guarded Codex runner requires a clean git checkout. The Factory Service must therefore create an initial baseline commit in the Generated Service before it can invoke the runner.
- The generation success bar should be a Continuation-Ready Generated Service, not a perfect one-shot final backend. The generated repository must be good enough to continue safely without rediscovering the product from scratch.
- The guarded Codex loop is materially stronger when it starts from generated project memory and planning artifacts. For generated repositories, `CONTEXT.md`, `docs/PRD.md`, and `features/<slug>.md` should be created before the first guarded implementation loop begins.
