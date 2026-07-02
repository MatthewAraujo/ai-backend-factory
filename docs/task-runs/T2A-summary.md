# T2A Summary

## Status

done

## What Changed

- Added the shared DDD-lite core primitives in `src/core`, including `UniqueEntityID`, `Entity`, `AggregateRoot`, `ValueObject`, domain-event registry, `Either`, and a base `UseCaseError`.
- Refactored `Account`, `GenerationJob`, and `Notification` to use aggregate roots and internal `UniqueEntityID` references while preserving their existing business behavior.
- Added typed domain invariant errors for the current aggregate validation and transition rules.
- Updated Prisma mappers, repositories, and test factories so persistence and lookup boundaries still use plain strings even though the domain model now uses `UniqueEntityID`.
- Added regression coverage for core identity/event behavior and the Prisma string-boundary mapping.

## Files Changed

- `docs/TASKS.md`
- `docs/task-runs/T2A-context.md`
- `src/core/**`
- `src/domain/account/enterprise/**`
- `src/domain/factory/enterprise/**`
- `src/domain/notification/enterprise/**`
- `src/infra/database/prisma/mappers/**`
- `src/infra/database/prisma/repositories/**`
- `test/factories/**`
- `test/repositories/fake-prisma.service.ts`

## Tests Added or Updated

- Added `src/core/entities/entity.spec.ts`
- Updated `src/domain/account/enterprise/entities/account.spec.ts`
- Updated `src/domain/factory/enterprise/entities/generation-job.spec.ts`
- Updated `src/domain/notification/enterprise/entities/notification.spec.ts`
- Updated `src/infra/database/prisma/repositories/prisma-repositories.spec.ts`

## Commands Run

- `pnpm test -- --run src/core/entities/entity.spec.ts src/domain/account/enterprise/entities/account.spec.ts src/domain/factory/enterprise/entities/generation-job.spec.ts src/domain/notification/enterprise/entities/notification.spec.ts src/infra/database/prisma/repositories/prisma-repositories.spec.ts`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

## Validation Result

- Focused T2A tests passed.
- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed.
- `pnpm test:e2e` was not run because this task only changed shared domain/core and repository-unit coverage.

## Decisions Made

- Keep domain aggregate ids and cross-aggregate references as `UniqueEntityID` instances inside the domain model, but continue using plain strings at repository lookup, Prisma, and HTTP-facing boundaries.
- Keep the domain-event infrastructure minimal for now: aggregate event collection plus a small in-process registry, without introducing subscribers in this task.
- Add typed invariant and transition errors next to the aggregates while keeping `UseCaseError` reserved for the application boundary.

## Follow-up Needed

- T3 should build register/authenticate use cases on top of the new `Either` and `UseCaseError` foundation.
- HTTP presenters and controller mapping in T3+ should convert aggregate ids back to strings explicitly at the boundary.
- No commit was created because the user did not explicitly authorize commits and the worktree already contained prior uncommitted changes.

## Context for Next Task

- `T3 — Implement Authentication And Protected Access` is the next runnable task.
- The account repository still accepts string lookups, while domain entities now expose `UniqueEntityID`, so T3 should keep id conversion at the application/controller edge.
