# Baseline bootstrap plus guarded Codex generation

AI Backend Factory will generate backend services in two phases.

First, the Factory Service creates a local baseline repository from blueprint-aligned assets and writes the workflow control files needed for follow-up work, including generated-repository instructions and a feature scope file.

Second, the Factory Service invokes a guarded local Codex runner against that generated repository until the selected feature scope has no ready tasks remaining.

We chose this over template-only generation because users expect real backend content, not only a matching folder structure. The baseline phase preserves repeatable stack setup and shared architecture. The guarded Codex phase adds the project-specific domain slice that turns the output into a usable backend service.

This decision also implies two hard rules:

- there is no template-only fallback when Codex orchestration is unavailable;
- the Factory Service must create an initial git commit for the generated baseline before invoking the guarded runner, because the runner requires a clean checkout.
