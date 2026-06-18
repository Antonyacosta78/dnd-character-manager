# Architecture: App Structure

## Metadata

- Status: `accepted`
- Created At: `2026-03-18`
- Last Updated: `2026-06-09`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-09` - `Antony Acosta` - Added an application-level front-end ownership note: backend/global-state coordination belongs in composition-oriented wrapper layers, while styling-heavy leaf UI stays presentational. Made with OpenCode.
- `2026-06-09` - `Antony Acosta` - Refactored this document into a high-level architecture index. Kept current-baseline overview guidance, removed duplicated front-end and back-end detail, and added canonical references for subsystem-specific rules. Made with OpenCode.
- `2026-06-09` - `Antony Acosta` - Removed migration-step references so this canonical app-structure document describes only the current active baseline. Made with OpenCode.
- `2026-06-08` - `Antony Acosta` - Rewrote backend-facing sections to align app structure with the active backend baseline and keep migration-history/process details out of the architecture body. Made with OpenCode.
- `2026-04-05` - `Antony Acosta` - Renamed planned domain terminology from game/games to adventure/adventures for instance-level play context consistency. Made with OpenCode.
- `2026-04-04` - `Antony Acosta` - Backfilled metadata and changelog sections for lifecycle tracking. Made with OpenCode.
- `2026-03-18` - `Antony Acosta` - Initial document created.

## Purpose

This document defines the current application structure at a high level.

It is the top-level architecture index for the repository.

Use this document to understand how the major runtime areas fit together, then follow the referenced subsystem documents for detailed boundaries and rules.

This document describes the current active baseline only. It does not claim final product completion.

## Document Role

This document:

- summarizes the active application shape
- explains how front-end, back-end, and browser-only state fit together
- points to the canonical architecture note for each detailed concern

This document does not:

- restate detailed front-end rendering, i18n, or design-system rules
- restate detailed backend layer rules or transport contracts
- replace subsystem-specific architecture notes

## Architecture Stance

The project remains a Next.js App Router modular monolith.

The active structure is intentionally split between:

- app shell and presentation code
- backend runtime boundaries for server-side operations
- client-side state and UI behavior where required

This split is a delivery boundary, not a repo-silo boundary. The application ships as one codebase, but each runtime area has distinct ownership rules.

## Current Application Map

### Front-End Runtime

Primary paths:

- `src/app/**/*`
- `src/components/**/*`
- `src/client/**/*` for browser-only state and rehydration support

Current role:

- render the App Router shell and route composition
- gather user intent
- handle browser-only interaction state where required
- call backend behavior only through approved entrypoints or explicit shell-safe stubs
- keep backend/global-state orchestration in wrapper, pattern, or route-composition layers instead of mixing it into styling-heavy leaf UI components

Canonical reference:

- `docs/architecture/front-end-architecture.md`

### Back-End Runtime

Primary paths:

- `src/app/api/**`
- `src/server/entrypoint/**`
- `src/server/middleware/**`
- `src/server/orchestration/**`
- `src/server/core/**`
- `src/server/services/**`

Current role:

- own transport entrypoints and backend execution flow
- enforce middleware concerns such as authn/authz and validation when active
- keep business logic and infrastructure concerns separated by layer

Canonical reference:

- `docs/architecture/back-end-architecture.md`

### Browser-Only State

Primary paths:

- `src/client/state/**`

Current role:

- own browser-only interaction state, global settings, and local draft/workflow state
- remain separate from canonical server-owned entity state

Canonical reference:

- `docs/architecture/global-state-management.md`

### Cross-Cutting Front-End Foundations

These concerns shape multiple runtime areas and should be treated as shared architectural foundations rather than route-local implementation details:

- internationalization and locale resolution
- Arcane Codex design-system tokens, primitives, and surface rules
- API error envelopes and caller-safe error mapping
- data-source trust boundaries, including `external/`

Canonical references:

- `docs/architecture/internationalization.md`
- `docs/architecture/design-system-decision-record.md`
- `docs/architecture/api-error-contract.md`
- `docs/architecture/data-sources.md`

## Active Baseline Summary

At the application level, the current baseline can be summarized as follows:

- Next.js App Router is the framework foundation.
- Front-end rendering is server-first, with client islands added only where browser APIs, client hooks, or local interaction state require them.
- The in-app shell is route-grouped and can intentionally render shell/reset states while backend-dependent behavior remains rolled back or stubbed.
- Backend HTTP entrypoints are exposed through `src/app/api/**` and delegated into `src/server/entrypoint/**`.
- Some backend surfaces intentionally return `501 Not Implemented` as explicit reset behavior; this is part of the active baseline, not an accidental partial state.
- Server-function scaffolding exists, but no active server-function operation is part of the current baseline.
- No active CLI command is part of the current application runtime baseline.

## High-Level Dependency Direction

Allowed high-level direction:

- UI and browser-only state -> backend entrypoint transport or explicit shell-safe stubs
- framework route wiring -> entrypoint -> middleware -> orchestration -> core
- orchestration -> services

High-level prohibitions:

- UI must not import Prisma, Better Auth internals, or backend service/orchestration/core internals directly.
- route wiring files must not own business logic or persistence access.
- core logic must not depend on transport, framework, or provider details.

Use the front-end and back-end architecture notes for detailed layer-specific rules.

## How To Use This Index

- Start here when you need the big-picture map of the app.
- Use `docs/architecture/front-end-architecture.md` for App Router rendering, shell, client-island, and UI-boundary decisions.
- Use `docs/architecture/back-end-architecture.md` for backend layer responsibilities, entrypoints, middleware, orchestration, and services.
- Use `docs/architecture/global-state-management.md` for client-state ownership and persistence rules.
- Use `docs/architecture/internationalization.md` and `docs/architecture/design-system-decision-record.md` for shared front-end foundations.
- Use `docs/architecture/api-error-contract.md` and `docs/architecture/data-sources.md` for cross-runtime safety contracts.

## Related Docs

- `docs/architecture/front-end-architecture.md`
- `docs/architecture/back-end-architecture.md`
- `docs/architecture/global-state-management.md`
- `docs/architecture/internationalization.md`
- `docs/architecture/design-system-decision-record.md`
- `docs/architecture/api-error-contract.md`
- `docs/architecture/data-sources.md`
- `docs/architecture/rearchitecture-proposal.md`
