# Single-process API and worker in v1

AI Backend Factory v1 will run the HTTP API and asynchronous generation worker in the same NestJS application process instead of splitting them into separate deployable services. We chose this because it preserves the forum-inspired modular monolith shape, keeps local setup and Docker simpler, and is sufficient for the first release while still supporting asynchronous job states and notifications.
