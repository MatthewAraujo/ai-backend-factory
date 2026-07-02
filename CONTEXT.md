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
The backend starter project produced by the Factory Service for a specific user request.
_Avoid_: clone, repo, app

**Workspace Root**:
The fixed local directory where the Factory Service creates Generated Services in v1, under `/home/matthew/personal/ai-backend-factory/repos`.
_Avoid_: per-request output path, arbitrary filesystem target, user-selected destination

**Generic Foundation**:
The reusable backend baseline produced in v1 before any domain-specific modules, entities, or business routes are added.
_Avoid_: final product, domain implementation, custom business logic

**Opinionated Stack**:
The single approved backend technology combination used by v1 for every Generated Service, derived from the Blueprint rather than selected per request.
_Avoid_: stack options, presets, variants

**Blueprint**:
The primary architectural reference that guides how the Factory Service and each Generated Service should be structured without copying a source system verbatim.
_Avoid_: template, starter code, boilerplate dump

**Deterministic Generation**:
The v1 generation approach where the Factory Service creates a Generated Service from local blueprint-aligned templates and assembly rules instead of using an LLM to write files.
_Avoid_: AI-first generation, freeform code synthesis, prompt-only scaffolding

**One-shot Generation**:
The v1 execution model where a Generation Job can be created and tracked but not cancelled or retried through the API.
_Avoid_: workflow control, retryable orchestration, cancellable runs

## Implementation Discoveries

- Bootstrap environments may leave `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` blank before T3. The env parser should normalize blank values to `undefined` so the service can boot before authentication is implemented.
- Nest constructor injection in the Vitest runtime should use explicit `@Inject(...)` parameter decorators for providers used in e2e tests. This avoids relying on constructor metadata that the test transform may not preserve consistently.
- Prisma repository adapters are intentionally typed against the small delegate surface they use. This keeps adapter contract tests fast with a fake Prisma client while preserving the Prisma-backed persistence boundary for later tasks.
