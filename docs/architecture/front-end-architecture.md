# Architecture: Front-End Architecture

## Metadata

- Status: `accepted`
- Created At: `2026-04-21`
- Last Updated: `2026-06-09`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-09` - `Antony Acosta` - Rewrote the front-end architecture note to align with the active backend baseline and remove references to the retired application/ports/adapters/composition model. Made with OpenCode.
- `2026-04-21` - `Antony Acosta` - Extracted and refactored front-end-relevant architecture boundaries from `app-architecture.md` into a standalone front-end reference.

## Purpose

This document defines the front-end runtime boundaries for the Next.js App Router application.

It exists to keep UI code delivery fast without letting business logic, data-access logic, or authorization enforcement leak into client-facing layers.

## Scope

This document covers:

- UI layer responsibilities and non-responsibilities.
- Front-end interaction boundaries with backend entrypoints and transport surfaces.
- Front-end-relevant dependency direction rules.
- Front-end safety constraints for authn/authz, backend imports, and data access.
- Front-end operational and testing implications from the active shell/reset baseline.

This document does not redefine backend internals beyond what is needed to keep front-end boundaries explicit.

## UI Layer Boundary

Primary paths:

- `src/app/**/*`
- `src/components/**/*`

UI responsibilities:

- Render views and gather user intent.
- Handle UI-local state and interaction flow.
- Delegate server-backed operations through approved backend entrypoints or intentional shell-safe stubs.

Explicitly out of scope for UI code:

- Core business rule evaluation.
- Direct Prisma access.
- Direct imports from `src/server/services/**`, `src/server/orchestration/**`, or `src/server/core/**`.
- Direct reads from `external/` data.

## Front-End Interaction with Backend Runtime

Canonical backend runtime reference:

- `docs/architecture/back-end-architecture.md`

Current active transport model for front-end callers:

- Route Handlers under `src/app/api/**`, wired to `src/server/entrypoint/api/**`.
- Server-rendered shell routes that may intentionally render stub or reset states while backend-dependent features remain rolled back.

Deferred or inactive transport model in current baseline:

- Server-function entrypoints are a planned backend boundary, but no active server-function operation exists in the current repo state.

Consequences for front-end implementation:

- UI should call backend behavior through route handlers or future server-function entrypoints, not by importing server internals.
- UI should treat transport responses and server-rendered payloads as the source of operation outcomes.
- UI must not reproduce orchestration or core business decisions client-side.
- When a route is intentionally stubbed or reset, UI should present that shell state explicitly instead of pretending the feature is active.

## Dependency Direction Rules (Front-End Relevant)

Allowed dependency direction relevant to front-end code:

- UI -> backend entrypoint transport or shell-safe route content

Broader architecture direction that front-end work must respect:

- framework route wiring -> entrypoint
- entrypoint -> middleware -> orchestration -> core
- orchestration -> services

Disallowed dependencies and shortcuts:

- UI -> Prisma or Better Auth internals.
- UI -> `src/server/services/**`, `src/server/orchestration/**`, or `src/server/core/**`.
- Core -> Next.js, Prisma, or Better Auth dependencies.
- Route files -> business logic or direct provider wiring.

Front-end implication: if a UI feature needs data or mutation behavior not currently exposed, add or extend a backend entrypoint path instead of bypassing the active layer model.

## Front-End Safety Constraints

Authentication and authorization remain first-class product concerns, but the current shell/reset baseline intentionally does not ship the old backend auth implementation.

- Ownership-sensitive decisions stay server-owned.
- Enforcement belongs in backend middleware and orchestration, never in client-only checks.
- Shell pages may exist before protected server behavior is reintroduced.

Hard rule for front-end safety:

- Do not rely on client-side checks for access safety.

Data-access safety rules for UI and front-end adjacent code:

- No direct Prisma access from UI.
- No direct reads from `external/` data.
- No direct server service, orchestrator, or core imports from UI; go through backend transport boundaries.

## Operational and Testing Implications for Front-End

Front-end code should align with runtime reliability expectations:

- Prefer deterministic behavior over permissive silent fallbacks.
- Surface failures clearly so integrity and policy violations are not masked by UI behavior.

Testing implications for front-end delivery:

- Keep business invariants tested in orchestration/core layers instead of duplicating that logic in UI tests.
- Use end-to-end coverage for critical user flows that cross UI and server boundaries once those backend flows are active, including:
  - branching flows
  - freeze snapshot flows
  - generation prerequisite flows
- For current shell/reset routes, verify that intentional empty, disabled, or not-implemented states stay explicit and stable.

## Related Docs

- `docs/architecture/app-architecture.md`
- `docs/architecture/back-end-architecture.md`
- `docs/architecture/global-state-management.md`
- `docs/architecture/api-error-contract.md`
- `docs/architecture/data-sources.md`
