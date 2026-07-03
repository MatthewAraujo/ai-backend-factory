# AI-Assisted Backend Generation

Status: ready

## Summary

Upgrade generation so a Factory Generation Job produces a real backend service, not only a template-shaped repository. The factory must bootstrap a generated repo, write generated-repository workflow files plus one feature scope, create an initial git commit, and then invoke the guarded Codex runner until that generated-repository scope is complete or fails.

## Why This Scope Exists

- The current generator copies a small baseline template and initializes git, but it does not create business-domain backend content.
- The `notes` field is persisted today but does not influence generated code.
- The guarded orchestration runner already exists outside this repository and expects clean repos plus `features/<slug>.md` scopes.
- The current docs still describe domain generation as out of scope, which conflicts with the accepted product direction.

## Files In Play

- `CONTEXT.md`
- `PROJECT.md`
- `docs/PRD.md`
- `docs/adr/0002-deterministic-v1-generation.md`
- `features/ai-assisted-backend-generation.md`
- `src/domain/factory/application/services/generated-service-generator.ts`
- `src/domain/factory/application/use-cases/process-generation-job.ts`
- `src/domain/factory/application/use-cases/process-generation-job.spec.ts`
- `src/infra/filesystem/local-generated-service-generator.ts`
- `src/infra/http/controllers/generation-jobs.e2e-spec.ts`
- `src/infra/http/http.module.ts`
- `src/infra/process/**`
- `templates/generated-service/v1/**`

## Source Context

- Requirements: `docs/PRD.md`
- Project memory: `PROJECT.md`, `CONTEXT.md`
- ADRs:
  - `docs/adr/0001-forum-inspired-architecture.md`
  - `docs/adr/0002-deterministic-v1-generation.md`
  - `docs/adr/0003-single-process-v1.md`
  - `docs/adr/0004-domain-core-and-use-case-error-boundary.md`
- Current seams:
  - authenticated `POST /generation-jobs`
  - `ProcessGenerationJobUseCase`
  - `LocalGeneratedServiceGenerator`
  - generation e2e coverage in `src/infra/http/controllers/generation-jobs.e2e-spec.ts`
- External dependency to integrate:
  - guarded orchestration runner under `/home/matthew/personal/skills/orchestration/run-task-loop-guarded.sh`

## Implementation Goal

Upgrade AI Backend Factory so one Factory Generation Job produces a generated repository that is immediately usable as a Codex workspace, then completes guarded Codex-driven domain generation inside that repository before reporting success.

## Non-Goals

- Change the public HTTP route surface beyond the existing generation endpoints.
- Add retry, cancellation, or partial-progress states.
- Support multiple generated feature scopes per Generation Job.
- Add remote GitHub provisioning or deployment automation.
- Replace the blueprint-aligned baseline stack selection logic.

## Acceptance Criteria Mapping

| Acceptance Criterion | Task(s) | Test(s) | Status |
| --- | --- | --- | --- |
| AC-5 Baseline repo, git init, initial commit before Codex | T1 | integration, e2e | planned |
| AC-7 Baseline includes workflow files and stack artifacts | T1, T4 | integration, e2e | planned |
| AC-8 Generated service includes working domain slice | T2, T4 | integration, e2e | planned |
| AC-9 Guarded runner completes selected feature scope | T2, T4 | unit, integration, e2e | planned |
| AC-10 Fail when Codex orchestration is unavailable or fails | T2, T3, T4 | unit, integration, e2e | planned |
| AC-12 Notifications still reflect terminal job states | T2, T3, T4 | unit, integration, e2e | planned |
| AC-15 New active scopes live under `features/<slug>.md` | T1 | filesystem integration | planned |

## Validation

- `pnpm test -- process-generation-job`
- `pnpm test:e2e -- generation-jobs`
- `pnpm typecheck`
- `pnpm lint`

## T1 — Bootstrap generated repos for guarded Codex execution

Status: done

Teach the generator to produce a Codex-runnable repository instead of only copying the baseline files. The generated repo must include repo-local instructions, a generated feature scope file, and an initial git commit after baseline bootstrap.

Affected files / areas:

- `src/infra/filesystem/local-generated-service-generator.ts`
- `src/domain/factory/application/services/generated-service-generator.ts`
- `src/infra/process/**`
- `templates/generated-service/v1/**`
- `src/domain/factory/application/use-cases/process-generation-job.spec.ts`
- `src/infra/http/controllers/generation-jobs.e2e-spec.ts`

Test-first plan:

- Update the generation use-case integration test to fail until the generated repo contains `AGENTS.md`, `WORKFLOW.md`, `features/<slug>.md`, and an initial git commit on top of git initialization.
- Update the generation e2e flow to fail until those bootstrap artifacts exist in the Generated Service output.

Implementation notes:

- Keep the baseline template copy as the first phase, but add repo-local control files and project-specific content generation after the copy.
- Introduce the minimal process abstraction needed to support both git initialization and git commit creation without coupling tests to shell internals.
- Generate exactly one feature scope file from `projectName`, `projectDescription`, and `notes`.
- Keep the generated repo clean before handing control to the later guarded runner task.

Dependencies:

- `docs/PRD.md`

Completion signal:

- A generated repo contains the baseline stack artifacts, repo-local workflow files, a single `features/<slug>.md`, and a baseline git commit, and the updated integration/e2e tests pass.

## T2 — Invoke guarded Codex orchestration from Generation Jobs

Status: done

Add an infrastructure seam for the guarded orchestration runner, wire it into generation after baseline bootstrap, and fail the Generation Job if the runner is unavailable or returns a failing result.

Affected files / areas:

- `src/domain/factory/application/use-cases/process-generation-job.ts`
- `src/domain/factory/application/services/generated-service-generator.ts`
- `src/infra/filesystem/local-generated-service-generator.ts`
- `src/infra/process/**`
- `src/infra/http/http.module.ts`
- `src/domain/factory/application/use-cases/process-generation-job.spec.ts`

Test-first plan:

- Add a failing use-case test for a guarded-runner failure path that transitions the Generation Job to `FAILED` with a useful failure reason and terminal notification.
- Add a failing success-path test that requires guarded-runner invocation after baseline bootstrap and before `SUCCEEDED`.

Implementation notes:

- Model guarded orchestration as an injected infrastructure service rather than embedding shell commands directly in the use case.
- Use the generated repo path plus its generated feature file when invoking the runner.
- Run the guarded loop to completion for that one generated-repository scope before returning success.

Dependencies:

- T1

Completion signal:

- `ProcessGenerationJobUseCase` succeeds only after guarded-runner completion and fails cleanly when orchestration is unavailable or unsuccessful.

## T3 — Persist and present richer generation outcomes

Status: done

Capture enough generation metadata and failure detail to make guarded-runner failures understandable from the Generation Job API and notification flow without changing the top-level lifecycle states.

Affected files / areas:

- `src/domain/factory/enterprise/entities/generation-job.ts`
- `src/infra/database/prisma/**`
- `src/infra/http/presenters/**`
- `src/domain/factory/application/use-cases/**`
- tests around repositories and presenters

Test-first plan:

- Add failing tests for persisted failure detail and any new output metadata needed to identify the generated feature scope or orchestration outcome.
- Add failing API assertions only if the PRD-required metadata must be surfaced publicly.

Implementation notes:

- Keep the public lifecycle states unchanged.
- Prefer additive metadata over broad schema churn.
- Do not expose noisy process internals unless they materially help the Factory User understand job failure.

Dependencies:

- T2

Completion signal:

- Generation Job reads and notifications preserve the existing contract while surfacing enough information to explain guarded-runner failures.

## T4 — Expand integration and end-to-end coverage for domain-aware generation

Status: ready

Update filesystem, use-case, and authenticated API tests so success requires generated-repository workflow files and guarded-runner completion, and failure covers Codex-orchestration errors with no template-only fallback.

Affected files / areas:

- `src/domain/factory/application/use-cases/process-generation-job.spec.ts`
- `src/infra/http/controllers/generation-jobs.e2e-spec.ts`
- any helper fakes added under `test/**`

Test-first plan:

- Add the highest-value success and failure assertions first at the use-case and e2e seams, then only add lower-level tests where behavior is still uncovered.

Implementation notes:

- Keep tests behavior-focused: generated files, git state, job state, notifications, and failure reasons.
- Prefer fake guarded-runner adapters in tests over invoking the external orchestration repo directly.

Dependencies:

- T1, T2, T3

Completion signal:

- Automated tests distinguish baseline-only bootstrap from fully successful generated-service completion and cover guarded-runner failure behavior.

## Risk Plan

- The external guarded runner is outside this repository. Mitigation: hide it behind an internal adapter and use fakes in tests.
- Generated repos must be clean before guarded execution. Mitigation: create the initial baseline commit in T1 and assert clean git state in tests.
- This upgrade changes success semantics significantly. Mitigation: keep the public API shape stable and add explicit failure coverage for runner unavailability.
- Template changes can easily drift from generated-repo expectations. Mitigation: assert the required workflow files and feature scope content through integration tests.

## Execution Order

1. T1 — baseline bootstrap for Codex-runnable repos
2. T2 — guarded runner invocation and failure semantics
3. T3 — richer persisted generation outcomes
4. T4 — expanded integration and e2e coverage

## Open Questions

No blocking open questions.

## Handoff To TDD

Ready for `tdd`. Start with T1 and write the failing bootstrap assertions in the generation use-case and e2e tests.
