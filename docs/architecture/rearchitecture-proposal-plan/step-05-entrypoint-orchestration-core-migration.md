# Step 5: Entrypoint, Orchestration, and Core Migration

## Metadata

- Status: `ready`
- Created At: `2026-05-21`
- Last Updated: `2026-06-07`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-07` - `Antony Acosta` - Marked step 5 as ready after review so operation migration work can proceed once service foundations are in place. Made with OpenCode.
- `2026-05-21` - `Antony Acosta` - Added step-5 plan for operation-level migration into entrypoint/orchestration/core boundaries and parity enforcement. Made with OpenCode.

## Goal

- Migrate all in-scope backend operations into the new execution path, preserving caller-facing behavior while removing legacy architecture dependencies.

## Preconditions

- Step 4 service/middleware foundation complete.
- Migration matrix from step 2 defines exact operation list and sequence.

## Work Items

1. Migrate REST API operations
   - Implement operation handlers in `src/server/entrypoint/api/**`.
   - Apply API middleware stack for authn/authz/schema concerns.
   - Keep `src/app/api/**/route.ts` as pure export wiring.

2. Migrate server-function operations
   - Implement handlers in `src/server/entrypoint/server-function/**`.
   - Apply server-function middleware composition model.
   - Normalize server-function error responses to sanitized caller-safe shape.

3. Migrate CLI operations
   - Move command handlers to `src/server/entrypoint/cli/**`.
   - Ensure outputs and failure paths map through typed entrypoint error policies.

4. Implement orchestration functions per operation
   - Add one orchestrator per externally invocable operation.
   - Orchestrators gather/persist data through services and call core functions.
   - Keep operation contracts typed with `OperationResult<T>`.

5. Implement core pure functions per domain rule
   - Move business-rule logic to `src/server/core/**` pure functions.
   - Enforce deterministic input/output behavior with typed interfaces.
   - Throw typed core errors for domain-invalid operations.

6. Enforce parity and split oversized operations
   - Validate endpoint parity rule: one operation -> one validator -> one orchestrator -> one or more closely related core functions.
   - Split endpoints that currently coordinate unrelated operations.

7. Add and backfill tests by layer
   - Core: unit tests for deterministic business behavior and domain error paths.
   - Orchestration: service-mocked tests for not-found/conflict/dependency failures.
   - Entrypoint: transport-mapping tests for HTTP status and CLI exit-code behavior.

## Deliverables

- Migrated entrypoint modules under `src/server/entrypoint/**`
- Migrated orchestration and core modules under `src/server/{orchestration,core}/**`
- Route handlers and CLI wiring aligned to new entrypoint boundaries
- Layered tests covering success and failure flows for migrated operations

## Verification Gate

- `bun run lint`
- `bun run build`
- Backend test suite for migrated operations (core + orchestration + entrypoint)
- API smoke checks for existing routes and CLI smoke checks for existing commands

## Exit Criteria

- Every migration-matrix operation runs through new entrypoint -> orchestration -> core path.
- No in-scope operation depends on legacy `application`/`ports`/`adapters` flow.
- Transport outputs remain sanitized and stable for expected caller behavior.

## Risks and Mitigations

- Risk: one-sweep migration causes broad regressions.
  - Mitigation: migrate in ordered vertical slices with test gates after each slice.
- Risk: mixed authorization ownership between middleware and orchestration.
  - Mitigation: document boundary rule per operation and require review signoff when business-data checks remain in orchestration.

## Roadmap / Status Impact

- `no roadmap progress impact`
