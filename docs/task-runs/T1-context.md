# T1 Context

## Task

Finish the bootstrap skeleton so the repo can typecheck, run unit tests, run e2e tests, and keep the baseline health and environment-validation surface working.

## Related PRD Acceptance Criteria

- AC-7: The generated service baseline must include health and documentation conventions.
- AC-8: The Factory Service must follow the forum-inspired modular monolith style.

## Relevant Prior Summaries

None yet.

## Files Likely Affected

- `vitest.config.ts`
- `vitest.config.e2e.ts`
- `tsconfig.json`
- `.gitignore`
- `.mise.toml`
- Existing bootstrap specs under `src/infra/**`

## Test-First Plan

- Re-run the existing failing unit and e2e commands to preserve the current red state.
- Fix the minimum configuration needed for Vitest to load and for test globals to typecheck.
- Re-run `typecheck`, `test`, and `test:e2e` before marking the task done.

## Constraints

- Limit scope to T1 bootstrap and tooling issues only.
- Do not start T2 domain or persistence work.
- Use `mise` to provide `pnpm` for validation commands.

## Risks

- Introducing new tooling config could create extra tracked files if not handled carefully.
- Fixing test config must not break Nest path alias resolution.

## Definition of Done

- `typecheck`, unit tests, and e2e tests pass through the documented scripts.
- The health endpoint and env validation coverage still pass.
- Task bookkeeping and handoff docs are updated.
