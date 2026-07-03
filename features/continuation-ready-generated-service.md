# Continuation-Ready Generated Service

Status: ready

## Summary

Upgrade AI Backend Factory so each generated backend repository becomes continuation-ready before the guarded implementation loop starts. The factory must synthesize generated repository memory and planning artifacts from the request, then hand the guarded loop a repo that already contains stable context, explicit assumptions, a generated PRD, and an execution-ready feature scope.

## Why This Scope Exists

- The current generator writes only thin project instructions and a generic three-task feature scope.
- The guarded loop is therefore starting implementation from weak repo-local context instead of from a request-shaped planning pack.
- The new contract is not to finish the perfect backend in one shot, but to produce the strongest serious first version of that backend so the user can continue safely afterward.
- The continuation-ready contract is now part of project memory and ADRs and should be reflected in generation behavior.

## Files In Play

- `CONTEXT.md`
- `PROJECT.md`
- `docs/PRD.md`
- `docs/adr/0005-continuation-ready-generated-service-contract.md`
- `features/continuation-ready-generated-service.md`
- `src/infra/filesystem/local-generated-service-generator.ts`
- `src/domain/factory/application/services/generated-service-generator.ts`
- `src/domain/factory/application/use-cases/process-generation-job.ts`
- `src/domain/factory/application/use-cases/process-generation-job.spec.ts`
- `src/infra/http/controllers/generation-jobs.e2e-spec.ts`
- `templates/generated-service/v1/**`

## Source Context

- Requirements: `docs/PRD.md`
- Project memory: `PROJECT.md`, `CONTEXT.md`
- ADRs:
  - `docs/adr/0002-deterministic-v1-generation.md`
  - `docs/adr/0005-continuation-ready-generated-service-contract.md`
- Current seams:
  - `LocalGeneratedServiceGenerator`
  - `ProcessGenerationJobUseCase`
  - generation e2e coverage in `src/infra/http/controllers/generation-jobs.e2e-spec.ts`
  - generated repository bootstrap content in `templates/generated-service/v1/**`

## Implementation Goal

Make one Factory Generation Job produce a generated repository that already contains the baseline stack, request-shaped project memory, a generated backend PRD, and an execution-ready feature plan before the guarded Codex implementation loop begins.

## Non-Goals

- Replace the existing opinionated stack or architectural style.
- Add multi-feature planning packs per Generation Job.
- Add interactive questioning during generation.
- Guarantee a fully complete backend in one generation pass.
- Change the public HTTP route surface or lifecycle state model.

## Acceptance Criteria Mapping

| Acceptance Criterion | Task(s) | Test(s) | Status |
| --- | --- | --- | --- |
| AC-5 Planning pack exists before guarded execution | T1, T3 | integration, e2e | in progress |
| AC-7 Baseline includes workflow files and docs | T1, T3 | integration, e2e | in progress |
| AC-8 Generated repo memory and PRD reflect the request | T1, T2, T3 | unit, integration, e2e | in progress |
| AC-10 Guarded execution starts after planning-pack synthesis | T3 | unit, integration, e2e | planned |
| AC-11 Failure still occurs for orchestration problems | T3 | unit, integration, e2e | planned |
| AC-16 Active scopes live under `features/<slug>.md` | T2, T3 | integration | planned |

## Validation

- `pnpm test -- process-generation-job`
- `pnpm test:e2e -- generation-jobs`
- `pnpm typecheck`
- `pnpm lint`

## T1 — Generate request-shaped repository memory

Status: done

Objective:
Teach the generator to create rich generated `PROJECT.md`, `CONTEXT.md`, and `README.md` content that reflects the request and the continuation-ready contract instead of only generic repository boilerplate.

Affected files / areas:

- `src/infra/filesystem/local-generated-service-generator.ts`
- `templates/generated-service/v1/**`
- generation filesystem assertions in tests

Test-first plan:

- Add failing integration assertions that the generated repo contains `PROJECT.md` and `CONTEXT.md` with request-shaped content instead of only generic placeholders.
- Add failing e2e assertions that the generated job output includes these repository memory files.

Implementation notes:

- Keep `PROJECT.md` focused on stable operational guidance for the generated stack.
- Keep `CONTEXT.md` focused on domain vocabulary, actors, workflows, invariants, defaults, and assumptions derived from `projectDescription` and `notes`.
- Avoid pretending hidden prompt internals are part of the repository contract; only durable project memory should be written.

Dependencies:

- `docs/PRD.md`

Completion signal:

- A generated repo contains materially useful `PROJECT.md` and `CONTEXT.md` that are shaped by the request and support later continuation.

Completed notes:

- The generator now writes request-shaped `PROJECT.md`, `CONTEXT.md`, and `README.md` content for each generated repository.
- Integration and e2e coverage now assert that generated repository memory exists and reflects `projectDescription`, `notes`, and the active feature scope path.

## T2 — Synthesize generated backend PRD and feature plan

Status: ready

Objective:
Generate repo-local `docs/PRD.md` and a much richer `features/<slug>.md` from the request so the guarded loop receives an execution-ready plan instead of a generic three-task placeholder.

Affected files / areas:

- `src/infra/filesystem/local-generated-service-generator.ts`
- generated repo `docs/**`
- generated repo `features/**`
- generation tests that inspect generated planning files

Test-first plan:

- Add failing integration assertions that the generated repo contains `docs/PRD.md` and that `features/<slug>.md` includes acceptance-criteria mapping, concrete tasks, and validation commands.
- Add failing e2e assertions that the generated plan content reflects `projectDescription` and `notes`.

Implementation notes:

- The generated PRD should preserve the repository’s current PRD shape but focus on the requested backend rather than on the factory itself.
- The generated feature scope should be derived from that PRD and should be execution-ready for the guarded loop.
- When the brief is underspecified, choose recommended defaults and record them explicitly as assumptions rather than stopping generation.

Dependencies:

- T1

Completion signal:

- A generated repo contains a request-shaped `docs/PRD.md` and an execution-ready `features/<slug>.md` that are strong enough for immediate guarded implementation.

## T3 — Reorder generation flow around the planning pack

Status: ready

Objective:
Make planning-pack synthesis an explicit stage of generation and ensure guarded execution reads the repo in the new document order after the baseline commit exists.

Affected files / areas:

- `src/domain/factory/application/services/generated-service-generator.ts`
- `src/domain/factory/application/use-cases/process-generation-job.ts`
- `src/infra/filesystem/local-generated-service-generator.ts`
- `src/domain/factory/application/use-cases/process-generation-job.spec.ts`
- `src/infra/http/controllers/generation-jobs.e2e-spec.ts`

Test-first plan:

- Add failing tests that guarded execution does not start until the generated repo contains `PROJECT.md`, `CONTEXT.md`, `docs/PRD.md`, and `features/<slug>.md`.
- Add failing tests that the generated `WORKFLOW.md` instructs the guarded loop to read `PROJECT.md -> CONTEXT.md -> docs/PRD.md -> features/<slug>.md -> tdd`.

Implementation notes:

- Preserve the clean-git requirement before invoking the guarded runner.
- Keep the external guarded runner behind the existing seam; this scope is about the repo contract and orchestration order, not about changing runner internals.
- Make the continuation-ready quality bar explicit in failure and success assertions where needed.

Dependencies:

- T1, T2

Completion signal:

- Generation creates the planning pack before git commit and guarded execution, and the updated tests prove the new document order and bootstrapping behavior.

## Risk Plan

- Generated repository docs may become verbose but still generic. Mitigation: assert request-shaped phrases and assumptions in integration tests.
- The generated PRD could drift from the repo’s planning conventions. Mitigation: preserve the current PRD shape and validate for required sections.
- Tightening success semantics can destabilize existing generation tests. Mitigation: update tests at the use-case and e2e seams first and keep assertions focused on observable repository artifacts.

## Execution Order

1. T1 — generated repository memory
2. T2 — generated PRD and feature plan
3. T3 — orchestration order and guarded-loop contract

## Open Questions

No blocking open questions.

## Handoff To TDD

Ready for `tdd`. T1 is complete. Start T2 next by adding failing assertions for generated `docs/PRD.md` and a richer `features/<slug>.md`.
