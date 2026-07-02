# T3 Context

## Task

Implement account registration, login, JWT issuance, and shared ownership-aware request access for protected routes.

## Related PRD Acceptance Criteria

- AC-1: A new user can register an account and authenticate through the Factory API using email, password, and JWT-based access.
- AC-4: Protected routes must resolve the authenticated Factory User so later job and notification routes can enforce ownership.
- AC-8: Keep the forum-inspired modular monolith structure with use cases, infrastructure adapters, and thin controllers.

## Relevant Prior Summaries

- `T1`: JWT env keys are currently optional during bootstrap, and explicit `@Inject(...)` is preferred for Nest DI stability in tests.
- `T2`: `AccountsRepository` already supports `findByEmail` and `findById`.
- `T2A`: Use cases should return `Either<UseCaseError, Result>`, while HTTP and repository boundaries keep ids as strings.

## Files Likely Affected

- `src/domain/factory/application/use-cases/**`
- `src/domain/factory/application/cryptography/**`
- `src/infra/auth/**`
- `src/infra/cryptography/**`
- `src/infra/http/controllers/register*`
- `src/infra/http/controllers/authenticate*`
- `src/infra/http/presenters/**`
- `src/infra/http/pipes/**`
- `src/infra/http/http.module.ts`
- `src/infra/app.module.ts`
- `src/**/*.e2e-spec.ts`

## Test-First Plan

- Add failing unit tests for registration success, duplicate email rejection, authentication success, and invalid credential rejection.
- Add failing e2e coverage for `/accounts` registration, `/sessions` login, invalid credentials, and unauthorized access to a protected probe route.
- Implement the minimum hashing, JWT, controllers, and guard wiring needed to pass those tests.

## Constraints

- Keep scope limited to auth and reusable authenticated-user resolution for future tasks.
- Reuse existing Nest/Prisma wiring without changing domain persistence contracts.
- Avoid touching unrelated modified files unless required by the task.

## Risks

- JWT configuration must work even though bootstrap currently allows blank key env vars.
- E2E tests may require a real database path through Prisma; avoid coupling auth tests to unrelated persistence setup where possible.
- Protected access should be reusable later without locking future job/notification controllers into awkward request shapes.

## Definition of Done

- Registration endpoint creates an account with a hashed password.
- Login endpoint validates credentials and returns a JWT.
- Protected route infrastructure resolves the authenticated Factory User.
- Unit and relevant e2e tests pass.
- `docs/TASKS.md` and task-run summary reflect the outcome.
