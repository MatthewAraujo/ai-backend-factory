# Continuation-ready generated service contract

AI Backend Factory will treat successful generation as the creation of a continuation-ready generated backend, not a perfect one-shot final backend.

We chose this because the factory cannot reliably infer every product nuance from a short brief, and pretending otherwise pushes the workflow toward brittle prompt inflation and misleading success semantics. The real value is to give the user a backend that already reflects their product intent, follows the opinionated architecture, and can be continued safely by the user or by later guarded Codex runs without redoing discovery.

This decision changes the generated-repository contract in three ways.

First, the generated repository must include a planning pack before guarded implementation starts. That pack includes:

- `PROJECT.md` for stable operational context and stack conventions
- `CONTEXT.md` for domain vocabulary, actors, workflows, invariants, assumptions, and request-specific constraints
- `docs/PRD.md` for the generated backend problem statement, scope, user stories, implementation decisions, test strategy, and out-of-scope items
- `features/<slug>.md` for the execution-ready implementation plan derived from that PRD

Second, the pre-implementation generation flow must become:

`baseline bootstrap -> silent discovery/context synthesis -> to-prd -> task-planner -> initial git commit -> guarded implementation loop`

The silent discovery/context synthesis step must not block on user input. It should enumerate the questions a normal discovery session would ask, choose the recommended answer when the brief is underspecified, and record any material uncertainty explicitly as assumptions instead of stopping the run.

Third, the success bar for the generated repository must be continuation readiness. A successful generated backend must:

- follow the opinionated backend stack and blueprint-aligned architecture
- document how to run, test, and continue the project
- include request-shaped project memory instead of only generic scaffolding
- include a task plan concrete enough for guarded implementation
- include at least one meaningful domain slice, not only empty modules or placeholders

The guarded implementation loop should therefore read generated repositories in this order:

`PROJECT.md -> CONTEXT.md -> docs/PRD.md -> features/<slug>.md -> tdd`

This decision does not require the factory to finish an entire backend autonomously. It requires the factory to produce the best serious first version of that backend so further work starts from a strong base instead of from a thin scaffold.
