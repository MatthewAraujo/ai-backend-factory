# T2 Context

## Task

Model the account, Generation Job, and notification domains plus their persistence layer so later authentication, job, and notification API work can build on stable aggregates and owner-scoped repositories.

## Related PRD Acceptance Criteria

- AC-1: Registration and login need persisted accounts.
- AC-2: Generation Job creation needs persisted request metadata.
- AC-3: Jobs need owner-backed persistence and v1 state handling.
- AC-4: Later list/get flows depend on owner-scoped repository queries.
- AC-9: Notification persistence is required before lifecycle events can store in-app notifications.

## Relevant Prior Summaries

- `docs/task-runs/T1-summary.md`: bootstrap, health, env validation, and test commands are already stable.

## Files Likely Affected

- `prisma/schema.prisma`
- `src/domain/account/**`
- `src/domain/factory/**`
- `src/domain/notification/**`
- `src/infra/database/**`
- `test/repositories/**`
- `test/factories/**`

## Test-First Plan

- Add unit tests for account creation rules, Generation Job defaults/state invariants, and notification read behavior.
- Add repository contract tests for owner-scoped queries and persisted job metadata.
- Implement the minimum schema, domain objects, repository ports, and Prisma adapters needed to make those tests pass.

## Constraints

- Execute only T2; do not start auth endpoints, job controllers, generation worker logic, or notification HTTP routes.
- Keep the design aligned with the forum-inspired modular monolith ADR.
- Preserve the current bootstrap test/build surface from T1.

## Risks

- A premature schema shape could make later auth/job work awkward, especially around ownership and terminal job metadata.
- Repository contracts need to stay behavior-focused so later adapters can evolve without rewriting tests.

## Definition of Done

- Prisma models exist for accounts, Generation Jobs, and notifications with the metadata the PRD requires.
- Domain objects and repository interfaces exist for the three bounded areas.
- Prisma-backed repositories support the owner-scoped read/write patterns required by the task plan.
- Relevant unit and repository tests pass, and task bookkeeping is updated.
