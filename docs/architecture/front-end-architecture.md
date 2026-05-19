# Architecture: Front-End Architecture

## Metadata

- Status: `completed`
- Created At: `2026-04-21`
- Last Updated: `2026-04-21`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-21` - `Antony Acosta` - Extracted and refactored front-end-relevant architecture boundaries from `app-architecture.md` into a standalone front-end reference.

## Purpose

This document defines the front-end runtime boundaries for the Next.js App Router application.

It exists to keep UI code delivery fast without letting business logic, data-access logic, or authorization enforcement leak into client-facing layers.

## Scope

This document covers:

- UI layer responsibilities and non-responsibilities.
- Front-end interaction boundaries with application services and transport surfaces.
- Front-end-relevant dependency direction rules.
- Front-end safety constraints for authn/authz and data access.
- Front-end operational and testing implications from the baseline runtime architecture.

This document does not redefine backend internals beyond what is needed to keep front-end boundaries explicit.

## UI Layer Boundary

Primary paths:

- `src/app/**/*`
- `src/components/**/*`

UI responsibilities:

- Render views and gather user intent.
- Handle UI-local state and interaction flow.
- Delegate business operations to application services via approved transport boundaries.

Explicitly out of scope for UI code:

- Domain rule evaluation.
- Direct Prisma access.
- Direct reads from `external/` data.

## Front-End Interaction with Application Services

Application services are implemented in `src/server/application/**/*` and own use-case orchestration, policy enforcement, and transaction boundaries.

For front-end callers, the runtime transport model is:

- Server Actions for app-internal operations where appropriate.
- Route Handlers for explicit HTTP boundaries and forward compatibility.

Consequences for front-end implementation:

- UI should call use-case entrypoints through Server Actions or Route Handlers, not infrastructure adapters.
- UI should consume deterministic, typed operation results exposed for UI/API consumers.
- UI should treat transport responses as the source for operation outcomes rather than reproducing business rules client-side.

## Dependency Direction Rules (Front-End Relevant)

Allowed dependency direction relevant to front-end code:

- UI -> Application

Broader architecture direction that front-end work must respect:

- Application -> Domain + Ports
- Adapters -> Ports
- Composition -> Application + Adapters + Ports

Disallowed dependencies and shortcuts:

- UI -> Prisma adapter.
- Domain -> Prisma/Better Auth/Next.js.
- Application -> raw `external/` file access.

Front-end implication: if a UI feature needs data or a mutation not currently exposed through an application boundary, add or extend an application-facing operation instead of bypassing the layer model.

## Front-End Safety Constraints

Authentication and authorization are first-class from v1.

- Auth provider is Better Auth with Prisma adapter.
- Ownership model is user-owned records with `ownerUserId` semantics.
- Enforcement location is application-layer use-cases.

Hard rule for front-end safety:

- Do not rely on client-side checks for access safety.

Data-access safety rules for UI and front-end adjacent code:

- No direct Prisma access from UI.
- No direct reads from `external/` data.
- No direct adapter calls from UI; go through application boundary and transport.

## Operational and Testing Implications for Front-End

Front-end code should align with runtime reliability expectations:

- Prefer deterministic behavior over permissive silent fallbacks.
- Surface failures clearly so integrity and policy violations are not masked by UI behavior.

Testing implications for front-end delivery:

- Keep business invariants tested in domain/application layers instead of duplicating that logic in UI tests.
- Use end-to-end coverage for critical user flows that cross UI and server boundaries, including:
  - branching flows
  - freeze snapshot flows
  - generation prerequisite flows

## Related Docs

- `docs/architecture/app-architecture.md`
- `docs/architecture/global-state-management.md`
- `docs/architecture/api-error-contract.md`
- `docs/architecture/data-sources.md`
