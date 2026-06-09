# Architecture: Back-End Architecture

## Metadata

- Status: `accepted`
- Created At: `2026-04-21`
- Last Updated: `2026-06-09`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-09` - `Antony Acosta` - Removed migration-step references so this canonical backend document describes only the current active backend baseline. Made with OpenCode.
- `2026-06-08` - `Antony Acosta` - Rewrote the canonical backend architecture doc to match the active backend baseline and keep migration-history/process details out of the architecture body. Made with OpenCode.
- `2026-04-21` - `Antony Acosta` - Created a standalone backend architecture note by extracting backend-relevant boundaries and decisions from app architecture and aligning references to existing backend foundation docs. Made with OpenCode.

## Purpose

This document defines the current active backend architecture in the repository.

It is the canonical backend boundary reference for implementation work. It intentionally describes the current active backend baseline only.

## Active Backend Baseline

The active backend uses a layered execution path:

- framework route wiring in `src/app/api/**`
- entrypoints in `src/server/entrypoint/**`
- orchestration in `src/server/orchestration/**`
- core business logic in `src/server/core/**`
- middleware in `src/server/middleware/**`
- infrastructure-facing services in `src/server/services/**`

Legacy modular-monolith layers such as `application`, `ports`, `adapters`, and `composition` are not part of the active runtime baseline for the migrated backend surfaces described below.

## Active Entrypoints

Current active backend entrypoints are:

- `GET /api/characters`
- `POST /api/auth/register`
- `GET /api/auth/[...all]` returning intentional `501 Not Implemented`
- `POST /api/auth/[...all]` returning intentional `501 Not Implemented`

No active CLI command is part of the current backend baseline.

Server-function scaffolding exists, but there is no active server-function operation in the current repo state.

## Boundary Rules

### Framework Wiring

Path:

- `src/app/api/**/route.ts`

Rules:

- route files are framework wiring only
- route files re-export handlers from `src/server/entrypoint/api/**`
- route files must not contain business logic, persistence access, or provider logic

### Entrypoint Layer

Path:

- `src/server/entrypoint/**`

Responsibilities:

- own transport-boundary request/response handling
- apply middleware for authentication, authorization, and schema validation
- invoke one orchestrator per externally invocable operation
- map typed internal errors into caller-safe transport failures

Rules:

- one externally invocable operation maps to one entrypoint path
- entrypoints do not implement business rules
- entrypoints do not access Prisma or Better Auth internals directly

### Orchestration Layer

Path:

- `src/server/orchestration/**`

Responsibilities:

- coordinate one backend operation at a time
- call services for data/session/provider access
- invoke related core functions
- return `OperationResult<T>` on success
- throw typed orchestration errors on operation failure

Rules:

- orchestration owns operation-level failure meaning such as conflict or not-found
- orchestration must not perform transport shaping

### Core Layer

Path:

- `src/server/core/**`

Responsibilities:

- hold pure, deterministic business logic
- normalize explicit input into explicit output
- preserve domain/business meaning independent of transport or infrastructure

Rules:

- no Prisma access
- no Better Auth access
- no Next.js or transport dependencies

### Middleware

Paths:

- `src/server/middleware/api/**`
- `src/server/middleware/server-function/**`
- `src/server/middleware/shared/**`

Responsibilities:

- enforce one focused transport-level concern before orchestration
- stop execution early through typed middleware errors when needed

Rules:

- middleware is entrypoint-only
- middleware may use services but must not invoke orchestration or core
- no CLI middleware in the current baseline

### Services

Paths:

- `src/server/services/db/**`
- `src/server/services/session/**`

Responsibilities:

- expose typed infrastructure-facing capabilities
- keep Prisma access centralized inside DB service
- keep Better Auth/provider-specific logic isolated inside Session service

Rules:

- services are used by orchestration and, when required, middleware
- services are not business-rule owners
- transaction clients stay internal to DB service

## Transport Notes

### REST

- `src/server/entrypoint/api/rest-contract.ts` defines the shared HTTP envelope helpers and transport-safe error mapping inputs
- active REST failures are sanitized before leaving the entrypoint boundary

### Auth Catch-All

The Better Auth catch-all route is intentionally unavailable in the current baseline.

- `GET /api/auth/[...all]` -> `501`
- `POST /api/auth/[...all]` -> `501`

This is a deliberate cutover/reset decision, not an accidental partial migration state.

## Deferred Scope

Catalog/import runtime code and removed backend-dependent feature implementations are outside this document's active backend baseline.

- catalog/import runtime code is not part of the active backend baseline described here
- removed backend-dependent feature implementations are not part of the active backend baseline described here
- this document does not mark the overall rearchitecture as complete

## Related Docs

- `docs/architecture/app-architecture.md`
- `docs/architecture/api-error-contract.md`
- `docs/architecture/rearchitecture-proposal.md`
