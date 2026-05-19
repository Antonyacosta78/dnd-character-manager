# Architecture: Back-End Architecture

## Metadata

- Status: `accepted`
- Created At: `2026-04-21`
- Last Updated: `2026-04-21`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-21` - `Antony Acosta` - Created a standalone backend architecture note by extracting backend-relevant boundaries and decisions from app architecture and aligning references to existing backend foundation docs. (Made with OpenCode)

## Purpose

This document defines the backend architecture for the current modular monolith. It extracts and focuses the backend-relevant runtime boundaries from `docs/architecture/app-architecture.md` so backend decisions are discoverable without frontend detail.

It exists to prevent backend drift in layering, transport choices, persistence boundaries, and operational behavior as catalog and gameplay features expand.

## Current Plan

### Backend stance in the modular monolith

The backend runs inside the Next.js App Router modular monolith and is intentionally optimized for delivery speed and domain consistency.

- Near-term risk is feature delivery drag, not service-scaling limits.
- Core gameplay invariants benefit from in-process consistency.
- Migration optionality is preserved through strict ports and composition seams.

The architecture is event-ready, not fully event-sourced. Seams for event-based evolution are preserved without adopting full event-sourcing operational overhead in v1.

### Layered backend model

#### 1) Application layer

Path:

- `src/server/application/**/*`

Responsibilities:

- implement use-cases and cross-module workflows
- orchestrate repositories, rules catalog reads, and transaction boundaries
- enforce authn/authz at operation boundaries
- return deterministic typed results to transport consumers

Rules:

- may coordinate multiple domain modules
- must not encode raw external format logic

#### 2) Domain layer

Path:

- `src/server/domain/**/*`

Responsibilities:

- own entities, value objects, and invariant-preserving behavior
- keep core logic pure where practical for high test density

Rules:

- no framework dependencies
- no ORM model dependencies
- no network/filesystem concerns

#### 3) Ports layer

Path:

- `src/server/ports/**/*`

Responsibilities:

- define stable capability contracts for repositories, rules catalog access, and auth/session context

Rules:

- ports describe semantics, not implementation details
- application/domain use ports as the only infrastructure dependency boundary
- rules catalog contract stays namespaced and grows additively (`rulesCatalog.classes.get`, `rulesCatalog.feats.list`)

#### 4) Adapters layer

Path:

- `src/server/adapters/**/*`

Responsibilities:

- implement ports with concrete infrastructure (`Prisma` repositories, Better Auth adapter, `DerivedRulesCatalog`, future `RawRulesCatalog`)

Rules:

- adapters may optimize internals
- adapters must not leak infrastructure-specific types beyond port contracts

#### 5) Composition layer

Path:

- `src/server/composition/**/*`

Responsibilities:

- wire concrete adapters to ports
- select implementations through configuration
- construct application services with resolved dependencies

Rules:

- use lightweight DI (factory/composition functions)
- avoid hidden service-locator patterns

### Persistence strategy and storage boundary

Persistence is Prisma plus repository adapters.

Design intent:

- SQLite-first for v1 convenience
- preserve uncomplicated migration path to Postgres
- keep domain/application logic storage-agnostic

Boundary rules:

- domain/application do not import Prisma client/model types directly
- SQL/storage optimizations stay adapter-side
- runtime use-cases consume repositories and catalog ports only

Rules-catalog storage/read-model constraints that affect backend behavior:

- runtime reads do not parse external source files in request paths
- publish and activation follow guarded two-phase behavior
- runtime readers are active-version scoped and deterministic for a fixed fingerprint
- integrity mismatch behavior follows `DATA_INTEGRITY_MODE` (`strict`, `warn`, `off`)

### Authn/authz policy location and shape

Authentication and authorization are backend-first concerns from v1.

- provider: Better Auth with Prisma adapter
- ownership model: user-owned records via `ownerUserId` semantics
- enforcement location: application-layer use-cases
- v1 policy shape: owner-based access by default, optional admin capability for diagnostics/operations

Client-side checks are never the access-control boundary.

### Transport model and backend interface posture

Default backend transport posture:

- Server Actions for app-internal server operations where appropriate
- Route Handlers for explicit HTTP boundaries and forward compatibility

Posture decisions:

- GraphQL is intentionally excluded in v1 due to overhead without current multi-client payoff
- tRPC remains optional, not default, and only if ergonomics become materially better

Transport/error consistency follows `docs/architecture/api-error-contract.md` for envelope and taxonomy behavior.

### Dependency direction and prohibited dependencies

Allowed direction:

- UI -> Application
- Application -> Domain + Ports
- Adapters -> Ports
- Composition -> Application + Adapters + Ports

Backend-specific prohibited examples:

- Domain -> Prisma, Better Auth, Next.js, filesystem/network adapters
- Application -> direct `external/` file access
- Route handlers/server actions -> direct adapter internals bypassing application services
- UI -> Prisma adapter

### Operational concerns

#### Observability

At minimum, backend instrumentation should include:

- use-case latency and failure rate
- integrity mismatch events
- active provider identity and dataset fingerprint at startup

#### Reliability

- prefer deterministic behavior over silent permissive fallback
- fail closed on integrity violations in strict environments
- keep transaction boundaries explicit in application services
- never partially activate a catalog version

#### Test strategy

- domain tests for invariant logic
- application tests for orchestration and policy enforcement
- adapter contract tests for persistence/provider behavior
- parity tests for catalog providers where both exist
- end-to-end tests for critical flows (branching, snapshot freeze, generation prerequisites)

### Backend evolution path

Expected sequence:

1. keep modular-monolith boundaries strict
2. expand provider parity tests (`DerivedRulesCatalog` and `RawRulesCatalog`)
3. run shadow-read comparisons for raw provider
4. consider provider-default changes only after parity and stability criteria are met

This keeps future extraction or provider migration feasible without introducing distributed complexity now.

## Boundaries

This note governs:

- backend runtime layering and dependency direction
- backend transport posture and auth enforcement location
- persistence/repository boundary rules and storage-agnostic intent
- backend operational expectations shared across features

This note does not govern:

- frontend UI architecture or presentation-level concerns
- parser implementation details already defined in parsing-specific architecture/spec docs
- feature-specific endpoint payload design

## Notes

- Treat this document as the backend-focused companion to `docs/architecture/app-architecture.md`, not a replacement.
- Keep cross-document decisions aligned with catalog lineage, storage/read-model, provider contract, and API error contract docs.

## Related Docs

- `docs/architecture/app-architecture.md`
- `docs/architecture/api-error-contract.md`
- `docs/architecture/data-sources.md`
- `docs/architecture/parsing-pipeline.md`
- `docs/architecture/rules-catalog-provider.md`
- `docs/architecture/catalog-lineage-and-import-runs.md`
- `docs/architecture/catalog-storage-and-read-model.md`
