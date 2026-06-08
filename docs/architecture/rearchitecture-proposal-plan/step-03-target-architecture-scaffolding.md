# Step 3: Target Architecture Scaffolding

## Metadata

- Status: `ready`
- Created At: `2026-05-21`
- Last Updated: `2026-06-07`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-07` - `Antony Acosta` - Marked step 3 as ready after review so target architecture scaffolding can start after migration inventory closes. Made with OpenCode.
- `2026-05-21` - `Antony Acosta` - Added step-3 scaffold plan for creating new backend layer folders, shared contracts, and framework-wiring constraints. Made with OpenCode.

## Goal

- Create minimal runnable skeleton for the new architecture so migration can proceed operation-by-operation without structural drift.

## Preconditions

- Step 2 inventory and migration matrix exist and are complete.

## Work Items

1. Create target backend folder structure
   - Add:
     - `src/server/entrypoint/api/**`
     - `src/server/entrypoint/server-function/**`
     - `src/server/entrypoint/cli/**`
     - `src/server/orchestration/**`
     - `src/server/core/**`
     - `src/server/middleware/{api,server-function,shared}/**`
     - `src/server/services/{db,session}/**`

2. Add shared operation and error primitives
   - Introduce `OperationResult<T>` identity typing for orchestration success payloads.
   - Add base `ServerError` and typed error-family entry points (`entrypoint`, `middleware`, `orchestration`, `core`, `db-service`, `session-service`).
   - Add entrypoint-level error mapping helpers for REST, server-function, and CLI surfaces.

3. Enforce framework-wiring-only route handlers
   - Refactor `src/app/api/**/route.ts` modules to re-export handlers from `src/server/entrypoint/api/**`.
   - Keep route files free from business logic, DB access, and orchestration internals.

4. Add traceability conventions
   - Require each entrypoint module to annotate implemented route(s) with `@implements` TSDoc.
   - Add naming guidance to avoid collisions for dynamic routes and grouped endpoint files.

5. Add temporary migration guards
   - Add lint/type constraints or check scripts to flag new edits under deprecated architecture paths unless explicitly part of migration.

## Deliverables

- New folder scaffolding under `src/server/{entrypoint,orchestration,core,middleware,services}`
- Shared primitives for operation result and error taxonomy
- API route modules converted to wiring-only shape
- Migration guard notes/check script (if lightweight)

## Verification Gate

- `bun run lint`
- `bun run build`
- Spot-check: each `src/app/api/**/route.ts` only wires exports from `src/server/entrypoint/api/**`

## Exit Criteria

- New architecture folders exist and compile.
- Route wiring policy is technically enforced and visible in code.
- Error base contracts exist and are consumable by all three entrypoint mechanisms.

## Risks and Mitigations

- Risk: scaffold introduces placeholder logic that leaks to production.
  - Mitigation: block unresolved placeholders behind explicit typed `NotImplemented` errors and checklist gates.
- Risk: route rewiring breaks method exports.
  - Mitigation: compare exported methods before and after rewiring per route.

## Roadmap / Status Impact

- `no roadmap progress impact`
