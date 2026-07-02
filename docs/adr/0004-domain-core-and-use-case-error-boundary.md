# Shared domain core and use-case `Either` boundary

AI Backend Factory will adopt the same DDD-lite core primitives described by `forum-blueprint.md` for both the Factory Service and the Generated Service baseline: `Entity`, `AggregateRoot`, `UniqueEntityID`, `ValueObject`, and in-process domain-event infrastructure.

We chose this because the repository goal is not only to copy the forum layering, but to dogfood the same core modeling contract that generated services should follow. Adding the primitives now keeps the factory aligned with its own output and avoids a later cross-cutting rewrite once authentication, job orchestration, and notification subscribers are already built.

`Either` and `UseCaseError` will be used at the application/use-case boundary, not inside entities or value objects. Domain objects keep direct creation and mutation APIs and enforce invariants with typed domain errors. Controllers will map `UseCaseError` instances to HTTP responses through an explicit shared mapper instead of hidden framework magic.

Domain ids will use `UniqueEntityID` inside the domain model, while application DTOs, repository lookups, Prisma records, and HTTP payloads continue to use plain strings at the boundary. This keeps infrastructure simple without leaking persistence or transport concerns into the domain layer.
