You are continuing this project from repository files only.

Do not rely on previous chat history.

Use the `task-runner` skill.

Goal:
Execute exactly one next runnable task from `docs/TASKS.md`.

Required behavior:
1. Load only the minimal necessary context:
   - `PROJECT.md`, if present
   - `CONTEXT.md`, if present
   - `docs/PRD.md`
   - `docs/TASKS.md`
   - relevant ADRs/glossary entries only if needed
   - relevant previous `docs/task-runs/*-summary.md` only if the selected task depends on them
2. Select exactly one task with `Status: ready` or `Status: planned`.
3. Create/update `docs/task-runs/<task-id>-context.md`.
4. Use `tdd` for that single task only.
5. Add or update tests when feasible.
6. Run relevant validation commands when possible.
7. Update `docs/TASKS.md` with the task status.
8. Create/update `docs/task-runs/<task-id>-summary.md`.
9. If the task is completed, write a meaningful commit subject to:

   `.agent/task-loop/last-commit-message.txt`

Commit message rules:
- Describe the actual code/documentation change.
- Do not use generic messages like "done task 2", "update files", or "fix stuff".
- Keep it short and specific.
- Example: "Add health check endpoint"
- Example: "Configure integration test database setup"

Stop after one task.
Do not start the next task.
