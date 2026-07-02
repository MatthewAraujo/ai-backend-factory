# T2A Context

## Task

Introduce the shared DDD-lite core primitives, refactor the existing aggregates to use them, and keep Prisma/repository boundaries string-based so later use cases and controllers can build on a stable core contract.

## Related PRD Acceptance Criteria

- AC-1: authentication work needs a stable account aggregate and `Either`/use-case error boundary.
- AC-2: generation-job creation needs a shared id and aggregate contract before use cases are added.
- AC-3: persisted jobs must preserve lifecycle behavior while moving ids inside the domain.
- AC-7: generated services are expected to follow the same core modeling contract as the factory.
- AC-8: the factory should use the same forum-inspired modular-monolith conventions it will later generate.
- AC-9: notification lifecycle work depends on aggregate/event primitives before subscribers are introduced.

## Relevant Prior Summaries

- `docs/task-runs/T2-summary.md`: current aggregates, Prisma schema, repositories, and mapper boundaries are already in place.

## Files Likely Affected

- `src/core/**`
- `src/domain/account/enterprise/**`
- `src/domain/factory/enterprise/**`
- `src/domain/notification/enterprise/**`
- `src/infra/database/prisma/mappers/**`
- `src/infra/database/prisma/repositories/**`
- `test/factories/**`

## Test-First Plan

- Add focused core tests for `UniqueEntityID`, entity equality, aggregate-root event collection, and typed domain invariant errors.
- Update aggregate specs to verify internal ids now use `UniqueEntityID` while business behavior stays unchanged.
- Add repository regression coverage to prove Prisma records and lookup APIs stay string-based across the mapper boundary.

## Constraints

- Execute only `T2A`; do not start auth use cases, controllers, or generation orchestration.
- Keep `Either` and `UseCaseError` at the application boundary, not inside entities or value objects.
- Preserve the current repository contracts and current passing bootstrap/persistence surface.

## Risks

- Refactoring ids across all aggregates can easily leak persistence details into the domain or break repository tests.
- Introducing domain events too broadly now could create unused abstractions; the implementation should stay minimal.
- Existing uncommitted task artifacts are present in the worktree, so edits must be narrowly scoped.

## Definition of Done

- Shared core primitives exist under `src/core` and are exercised by tests.
- `Account`, `GenerationJob`, and `Notification` use the shared core while keeping external repository boundaries string-based.
- Repository and mapper tests prove the string-to-`UniqueEntityID` boundary is preserved.
- `Either` and a `UseCaseError` foundation exist for T3+ without changing current business behavior.
