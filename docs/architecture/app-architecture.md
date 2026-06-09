# Architecture: App Structure

## Metadata

- Status: `completed`
- Created At: `2026-03-18`
- Last Updated: `2026-06-09`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-09` - `Antony Acosta` - Removed migration-step references so this canonical app-structure document describes only the current active baseline. Made with OpenCode.
- `2026-06-08` - `Antony Acosta` - Rewrote backend-facing sections to align app structure with the active backend baseline and keep migration-history/process details out of the architecture body. Made with OpenCode.
- `2026-04-05` - `Antony Acosta` - Renamed planned domain terminology from game/games to adventure/adventures for instance-level play context consistency. Made with OpenCode.
- `2026-04-04` - `Antony Acosta` - Backfilled metadata and changelog sections for lifecycle tracking. Made with OpenCode.
- `2026-03-18` - `Antony Acosta` - Initial document created.

## Purpose

This document defines the current application structure at a high level.

It describes how the app shell, frontend routes, and active backend baseline fit together in the current repo state. It does not claim final project completion.

## Architecture Stance

The project remains a Next.js App Router modular monolith.

The active structure is intentionally split between:

- app shell and presentation code
- backend runtime boundaries for server-side operations
- client-side state and UI behavior where required

## Primary Runtime Boundaries

### UI and App Shell

Paths:

- `src/app/**/*`
- `src/components/**/*`

Responsibilities:

- render the shell and presentation layers
- gather user intent
- call backend entrypoints only through approved backend boundaries
- avoid direct dependency on legacy backend internals

Rules:

- client code must not import Prisma, Better Auth provider internals, or backend service internals directly
- server-rendered app shell code may exist without active backend feature behavior when a route is intentionally stubbed/reset

### Backend Runtime

Canonical backend reference:

- `docs/architecture/back-end-architecture.md`

Active backend layers:

- framework route wiring in `src/app/api/**`
- entrypoints in `src/server/entrypoint/**`
- orchestration in `src/server/orchestration/**`
- core logic in `src/server/core/**`
- middleware in `src/server/middleware/**`
- services in `src/server/services/**`

The previous `application` / `ports` / `adapters` / `composition` layering is not part of the active baseline for migrated runtime paths.

### Client State

Paths:

- `src/client/**/*`

Responsibilities:

- own browser-only interaction state and local workflow state
- remain separate from backend transport or persistence ownership

## Dependency Direction

Allowed high-level direction:

- UI -> backend entrypoint transport or shell-safe stubs
- entrypoint -> middleware -> orchestration -> core
- orchestration -> services

Disallowed high-level direction:

- UI -> Prisma or Better Auth internals
- Core -> services, transport, framework, or provider logic
- route wiring files -> direct business logic or persistence access

## Current Transport Posture

Active HTTP routes:

- `GET /api/characters`
- `POST /api/auth/register`
- `GET /api/auth/[...all]` returning intentional `501`
- `POST /api/auth/[...all]` returning intentional `501`

Current server-function posture:

- scaffolding exists
- no active server-function operation in repo state

Current CLI posture:

- no active CLI command is part of the current baseline
- deferred catalog/import CLI scope is not considered active application runtime

## Shell and Reset Notes

The app shell may intentionally preserve non-functional or stubbed routes/components where later reimplementation is planned.

That is currently acceptable for:

- auth transport removed from active use and surfaced as intentional `501`
- backend-dependent app shell behaviors replaced with shell-safe stubs where required

This document therefore describes the current active baseline, not the final long-term product state.

## Related Docs

- `docs/architecture/back-end-architecture.md`
- `docs/architecture/api-error-contract.md`
- `docs/architecture/rearchitecture-proposal.md`
