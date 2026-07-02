# T3 Summary

## Status

done

## What Changed

- Added register and authenticate use cases for Factory accounts with duplicate-email and invalid-credential handling via `Either<UseCaseError, ...>`.
- Added bcrypt-based password hashing, JWT issuance, a reusable JWT auth guard, and a `CurrentUser` decorator for protected route access.
- Added HTTP endpoints for `POST /accounts` and `POST /sessions` plus presenters and request validation.
- Added focused unit tests for the auth use cases and e2e coverage for registration, login, unauthorized access, and current-user resolution on a protected route.

## Files Changed

- `docs/TASKS.md`
- `PROJECT.md`
- `docs/task-runs/T3-context.md`
- `src/domain/factory/application/cryptography/**`
- `src/domain/factory/application/use-cases/**`
- `src/infra/auth/**`
- `src/infra/cryptography/**`
- `src/infra/env/env.service.ts`
- `src/infra/http/http.module.ts`
- `src/infra/http/controllers/authenticate-account.controller.ts`
- `src/infra/http/controllers/authentication.e2e-spec.ts`
- `src/infra/http/controllers/register-account.controller.ts`
- `src/infra/http/presenters/account.presenter.ts`
- `src/infra/http/presenters/use-case-error-presenter.ts`
- `test/repositories/in-memory-accounts-repository.ts`
- `test/setup-e2e.ts`
- `tsconfig.json`

## Tests Added or Updated

- Added `src/domain/factory/application/use-cases/register-account.spec.ts`
- Added `src/domain/factory/application/use-cases/authenticate-account.spec.ts`
- Added `src/infra/http/controllers/authentication.e2e-spec.ts`

## Commands Run

- `pnpm test -- --run src/domain/factory/application/use-cases/register-account.spec.ts src/domain/factory/application/use-cases/authenticate-account.spec.ts`
- `pnpm test:e2e -- --run src/infra/http/controllers/authentication.e2e-spec.ts src/infra/http/controllers/health.controller.e2e-spec.ts`
- `pnpm typecheck`
- `pnpm exec biome check src/domain/factory/application/cryptography/hash-generator.ts src/domain/factory/application/cryptography/hash-comparer.ts src/domain/factory/application/cryptography/encrypter.ts src/domain/factory/application/use-cases/errors/account-already-exists-error.ts src/domain/factory/application/use-cases/errors/invalid-credentials-error.ts src/domain/factory/application/use-cases/register-account.ts src/domain/factory/application/use-cases/authenticate-account.ts src/domain/factory/application/use-cases/register-account.spec.ts src/domain/factory/application/use-cases/authenticate-account.spec.ts src/infra/auth/auth.module.ts src/infra/auth/current-user.ts src/infra/auth/current-user.decorator.ts src/infra/auth/jwt.ts src/infra/auth/jwt-auth.guard.ts src/infra/cryptography/bcrypt-hasher.ts src/infra/cryptography/jwt-encrypter.ts src/infra/env/env.service.ts src/infra/http/http.module.ts src/infra/http/controllers/register-account.controller.ts src/infra/http/controllers/authenticate-account.controller.ts src/infra/http/controllers/authentication.e2e-spec.ts src/infra/http/presenters/account.presenter.ts src/infra/http/presenters/use-case-error-presenter.ts test/repositories/in-memory-accounts-repository.ts test/setup-e2e.ts`

## Validation Result

- Focused auth unit tests passed.
- Focused auth and health e2e tests passed.
- `pnpm typecheck` passed.
- Focused Biome checks for the T3 files passed.
- Full-repo `pnpm lint` was not left as a passing signal in this run because the worktree already contained an unrelated local modification in `src/infra/http/controllers/health.controller.ts`.

## Decisions Made

- Kept application-layer auth errors as `UseCaseError` results and mapped them explicitly to HTTP exceptions.
- Added a reusable `CurrentUser` decorator and JWT guard so later job and notification controllers can enforce ownership without duplicating token parsing.
- Used a small local HS256 JWT helper in `src/infra/auth/jwt.ts` instead of depending on extra runtime package resolution for token signing and verification.
- Kept JWT env vars optional for local/test flows by resolving a fallback secret in `EnvService`.

## Follow-up Needed

- T4 can build Generation Job controllers on top of the new authenticated-user resolution.
- Production-grade JWT key management should replace the local fallback secret before deployment hardening work.

## Context for Next Task

- `T4 — Implement Generation Job API Surface` is now the next runnable task.
- The auth surface now provides account registration, session creation, and a reusable protected-route current-user mechanism.
