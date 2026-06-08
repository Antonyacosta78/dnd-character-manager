# Rearchitecture Proposal Implementation Plan (Multipart)

## Metadata

- Status: `ready`
- Created At: `2026-05-21`
- Last Updated: `2026-06-07`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-07` - `Antony Acosta` - Marked multipart rearchitecture plan set as ready after review so implementation work can proceed. Made with OpenCode.
- `2026-05-21` - `Antony Acosta` - Created multipart implementation-plan index for backend rearchitecture rollout after coding-standards alignment (step 1). Made with OpenCode.

## Purpose

- Break `docs/architecture/rearchitecture-proposal.md` into executable implementation phases.
- Keep each phase independently readable so contributors can work in sequence without re-parsing the full proposal.
- Track dependencies between phases in a way that supports full-rewrite execution (no coexistence model).

## Phase Map

1. Step 1: Coding rules alignment
   - Doc: `docs/architecture/rearchitecture-proposal-plan/step-01-coding-rules-alignment.md`
   - Focus: align `.rulesync/rules/10-coding-standards.md` with proposal-specific backend standards before migration.

2. Step 2: Baseline and migration inventory
   - Doc: `docs/architecture/rearchitecture-proposal-plan/step-02-baseline-and-migration-inventory.md`
   - Focus: freeze scope, inventory current backend surfaces, define migration matrix and cutover ledger.

3. Step 3: Target architecture scaffolding
   - Doc: `docs/architecture/rearchitecture-proposal-plan/step-03-target-architecture-scaffolding.md`
   - Focus: create new layer folders/contracts and route-wiring baseline.

4. Step 4: Services and middleware foundation
   - Doc: `docs/architecture/rearchitecture-proposal-plan/step-04-services-and-middleware-foundation.md`
   - Focus: DB/Session services, middleware model by entrypoint mechanism, error-family plumbing.

5. Step 5: Entrypoint, orchestration, and core migration
   - Doc: `docs/architecture/rearchitecture-proposal-plan/step-05-entrypoint-orchestration-core-migration.md`
   - Focus: migrate API, server functions, and CLI to new layers using endpoint parity rules.

6. Step 6: Cutover, cleanup, and completion evidence
   - Doc: `docs/architecture/rearchitecture-proposal-plan/step-06-cutover-cleanup-and-completion-evidence.md`
   - Focus: remove deprecated architecture modules, update canonical docs/contracts, and close rollout gates.

7. Step 7: Feature reset and rollback
   - Doc: `docs/architecture/rearchitecture-proposal-plan/step-07-feature-reset-and-rollback.md`
   - Focus: remove previously implemented backend-dependent features, preserve shell/scaffolding, and mark retained docs as `rolled back` for later reimplementation.

## Global Constraints For All Steps

- Full rewrite only: no coexistence fallback between old and new backend architecture.
- Route handlers under `src/app/api/**` must become framework wiring only.
- Middleware is entrypoint-layer only; orchestration owns operation execution; core remains pure.
- `src/server/import/**` and rules-catalog work are deprecated and moved out of active runtime scope.
- Error translation and external sanitization happen only at entrypoint boundaries.

## Cross-Phase Verification Baseline

- Minimum per step: `bun run lint`.
- Required before final cutover: `bun run build` and targeted backend tests.
- Contract validation before closeout: API/CLI behavior checked against updated `docs/architecture/api-error-contract.md`.

## Roadmap / Status Impact

- `no roadmap progress impact`
- Reason: this artifact decomposes planned implementation work; it does not by itself claim completed code delivery.
