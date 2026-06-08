# Step 2: Baseline and Migration Inventory

## Metadata

- Status: `completed`
- Created At: `2026-05-21`
- Last Updated: `2026-06-08`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-08` - `Antony Acosta` - Marked step 2 as completed after the migration matrix, deprecation ledger, and cutover checklist were created. Explicitly classified blocked and deferred rows as intentional planning outputs rather than unknown scope. Made with OpenCode.
- `2026-06-07` - `Antony Acosta` - Marked step 2 as ready after review so migration inventory work can proceed once coding rules are aligned. Made with OpenCode.
- `2026-05-21` - `Antony Acosta` - Added step-2 execution plan to establish migration inventory, scope freeze rules, and cutover ledger before code rewrites. Made with OpenCode.

## Goal

- Convert proposal intent into a concrete migration backlog with one row per backend operation.
- Remove ambiguity about what moves, what is deprecated, and what must be rewritten in one sweep.

## Preconditions

- Step 1 completed: coding rules aligned in `.rulesync/rules/10-coding-standards.md`.
- `docs/architecture/rearchitecture-proposal.md` remains canonical for new backend boundaries.

## Work Items

1. Lock migration scope and supersession intent
   - Record that proposal supersedes old backend architecture docs once implementation closes.
   - Confirm no coexistence policy and no partial fallback paths.

2. Build full backend surface inventory
   - Inventory REST routes under `src/app/api/**/route.ts`.
   - Inventory CLI entrypoints under `src/server/cli/**`.
   - Inventory server functions (search for `"use server"` and direct server-side entry calls).
   - Inventory current application/domain-style operations under `src/server/application/**`.

3. Build dependency migration matrix
   - For each operation, map old path to target paths in:
     - `src/server/entrypoint/**`
     - `src/server/orchestration/**`
     - `src/server/core/**`
     - `src/server/services/**` (only when infrastructure access needed)
   - Track auth, validation, and authorization requirements per operation.

4. Define deprecation ledger
   - List modules to remove or move to `_deprecated`, especially:
     - `src/server/import/**`
     - rules-catalog runtime pieces under `src/server/adapters/rules-catalog/**`
   - Add explicit owner and removal gate for each deprecated path.

5. Set cutover readiness criteria
   - Define what must be true before deleting legacy folders.
   - Add no-go rules for unresolved migration rows.

## Deliverables

- `docs/architecture/rearchitecture-proposal-plan/artifacts/migration-matrix.md`
- `docs/architecture/rearchitecture-proposal-plan/artifacts/deprecation-ledger.md`
- `docs/architecture/rearchitecture-proposal-plan/artifacts/cutover-readiness-checklist.md`

## Verification Gate

- All known backend entrypoints are represented in the migration matrix (no unmapped route/CLI/server-function operations).
- Every deprecation candidate has a replacement strategy or explicit archive decision.
- Matrix reviewed against `docs/architecture/rearchitecture-proposal.md` for boundary compliance.

## Exit Criteria

- Migration matrix approved for execution order.
- No unknown-scope backend folders remain.
- Cutover checklist drafted with objective pass/fail gates.
- Blocked and deferred rows are explicitly classified in the Step 2 artifacts and carried forward as later-step inputs rather than treated as unknown scope.

## Risks and Mitigations

- Risk: hidden server-side entrypoints missed during inventory.
  - Mitigation: require code search by transport pattern and by imported use-case symbol.
- Risk: migration rows mix unrelated concerns.
  - Mitigation: enforce endpoint parity rule (one operation -> one validator/orchestrator chain).

## Roadmap / Status Impact

- `no roadmap progress impact`
