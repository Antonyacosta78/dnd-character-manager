# Architecture: App Structure

## Metadata

- Status: `completed`
- Created At: `2026-03-18`
- Last Updated: `2026-04-04`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-04` - `Antony Acosta` - Backfilled metadata and changelog sections for lifecycle tracking. (Made with OpenCode)
- `2026-03-18` - `Antony Acosta` - Initial document created.

## Purpose

This document is the baseline runtime architecture for the application. It defines the boundaries that protect delivery speed now while keeping migration cost bounded as the product moves from character core to branching timelines, snapshots, and output generation.

The primary audience is senior engineers and AI coding agents. The goal is not to explain web architecture fundamentals; the goal is to prevent accidental coupling and keep major decisions explicit.

## Architecture Stance

The project uses a modular monolith on Next.js App Router.

Why this is intentional:

- The near-term risk is feature delivery drag, not service scaling limits.
- The product has domain complexity (branching, progression validity, immutable snapshots) that benefits from in-process consistency.
- We can preserve migration optionality with strict ports and provider boundaries without introducing distributed systems overhead in v1.

This is an event-ready architecture, not a full event-sourced architecture. We keep seams for future event-based evolution but do not accept the operational and cognitive tax of full event sourcing yet.

## Layered Runtime Model

### 1) UI Layer

Paths:

- `src/app/**/*`
- `src/components/**/*`

Responsibilities:

- Render views and gather user intent.
- Perform UI-local state handling and interaction flow.
- Delegate all business operations to application services/actions.

Explicitly out of scope:

- Domain rule evaluation.
- Direct Prisma access.
- Direct reads from `external/` data.

### 2) Application Layer

Path:

- `src/server/application/**/*`

Responsibilities:

- Implement use-cases (`createCharacter`, `planLevel`, `branchTimeline`, `freezeSnapshot`, etc.).
- Orchestrate repositories, rules catalog queries, and transaction boundaries.
- Enforce authn/authz checks at operation boundaries.

Rules:

- Application services may coordinate multiple domain modules.
- Application services must not encode raw external format logic.
- Application services return deterministic, typed results for UI/API consumers.

### 3) Domain Layer

Path:

- `src/server/domain/**/*`

Responsibilities:

- Own core invariants and business behavior.
- Define entities/value objects and domain services.
- Provide pure logic where practical to maximize test density.

Rules:

- No framework dependencies.
- No ORM model dependencies.
- No network/filesystem concerns.

### 4) Ports Layer

Path:

- `src/server/ports/**/*`

Responsibilities:

- Define stable contracts for adapters:
  - repositories
  - rules catalog (namespaced reader contract)
  - auth/session context

Rules:

- Ports describe capability and semantics, not implementation details.
- Ports are the only dependency application/domain layers use for infrastructure concerns.

Rules catalog contract note:

- Prefer namespaced readers (`rulesCatalog.classes.get`, `rulesCatalog.feats.list`) over flat method growth.
- Extend contract additively when new gameplay domains are introduced.

### 5) Adapters Layer

Path:

- `src/server/adapters/**/*`

Responsibilities:

- Concrete implementations for ports:
  - Prisma repositories
  - Better Auth session adapters
  - `DerivedRulesCatalog` and future `RawRulesCatalog`

Rules:

- Adapter internals are free to optimize, but external behavior must satisfy port contracts.
- Adapters must not leak implementation-specific types past the port boundary.

### 6) Composition Layer

Path:

- `src/server/composition/**/*`

Responsibilities:

- Runtime wiring of concrete adapters to ports.
- Configuration-based implementation selection.
- Construction of application services with resolved dependencies.

Rules:

- Lightweight DI only (factories/composition functions).
- No global service locator patterns hidden in unrelated modules.

## Domain Module Boundaries

The following modules are first-class boundaries and should remain explicit:

- `characters`
  - persistent identity
  - lifecycle status
  - ownership model
- `progression`
  - level-by-level plan semantics
  - missing-level and invalid-state detection
- `branches`
  - timeline branching behavior
  - world lock semantics post-branch
- `worlds`
  - continuity grouping
  - world-level context and constraints
- `games`
  - playable context metadata
  - association between game and chosen snapshot/version
- `snapshots`
  - immutable freeze records
  - provenance from branch and level at freeze time

Cross-module workflows belong in application services, not ad-hoc imports from one domain module into another.

## Non-Negotiable Product Invariants

These invariants are architecture-level requirements, not optional validations:

1. Character identity is independent from any game instance.
2. A branch, once created, is world-locked.
3. Generating a playable output at level N requires required inputs for levels `1..N`.
4. Snapshots are immutable after creation.
5. Game history references frozen snapshots, never mutable planning data.

If a feature conflicts with these invariants, the feature design must change.

## Persistence Strategy

The persistence approach is Prisma + repository adapters.

Design intent:

- Use SQLite for local/v1 convenience.
- Preserve an uncomplicated migration path to Postgres.
- Keep domain/application logic storage-agnostic.

Constraints:

- Domain/application must not import Prisma client/model types directly.
- SQL/storage-specific optimizations remain in adapter code.
- Migrations must preserve immutable snapshot semantics and timeline consistency.

## Authentication and Authorization

Authentication and authorization are first-class from v1, not retrofit concerns.

- Auth provider: Better Auth with Prisma adapter.
- Ownership model: user-owned records with `ownerUserId` semantics.
- Enforcement location: application layer use-cases.
- Policy model for v1:
  - owner-based access by default
  - optional admin capability for diagnostics/operations

Do not rely on client-side checks for access safety.

## API/Transport Decision

Default runtime transport model:

- Server Actions for app-internal operations where appropriate.
- Route Handlers for explicit HTTP boundaries and future compatibility.

Decision record:

- GraphQL is intentionally excluded from v1 due to schema/resolver overhead with no current multi-client payoff.
- tRPC remains optional if typed RPC ergonomics become materially better than current action/handler ergonomics.

## Dependency Direction Rules

Allowed high-level dependency direction:

- UI -> Application
- Application -> Domain + Ports
- Adapters -> Ports
- Composition -> Application + Adapters + Ports

Disallowed examples:

- UI -> Prisma adapter
- Domain -> Prisma/Better Auth/Next.js
- Application -> raw `external/` file access

## Operational Concerns

### Observability

At minimum, instrument:

- use-case latency and failure rates
- integrity mismatch events
- catalog provider identity and dataset fingerprint at startup

### Reliability

- Prefer deterministic behavior over permissive silent fallbacks.
- Fail closed on integrity violations in strict environments.
- Keep transactional boundaries explicit in application services.

### Test Strategy

- Domain tests validate invariants in isolation.
- Application tests validate orchestration and policy enforcement.
- Adapter tests validate persistence/provider contract compliance.
- End-to-end tests cover critical user flows (branching, freeze snapshot, generation prerequisites).

## Evolution Path

The expected evolution path is:

1. Strengthen modular monolith boundaries.
2. Add provider parity tests (`DerivedRulesCatalog` vs `RawRulesCatalog`).
3. Introduce shadow-read comparisons for raw provider.
4. Consider changing default provider only after parity and stability criteria are met.

## Related Docs

- `docs/architecture/data-sources.md`
- `docs/architecture/parsing-pipeline.md`
- `docs/architecture/rules-catalog-provider.md`
- `docs/architecture/catalog-lineage-and-import-runs.md`
