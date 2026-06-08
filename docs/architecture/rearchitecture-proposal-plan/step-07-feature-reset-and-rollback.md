# Step 7: Feature Reset and Rollback

## Metadata

- Status: `completed`
- Created At: `2026-06-08`
- Last Updated: `2026-06-08`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-08` - `Antony Acosta` - Marked step 7 as completed after backend-dependent feature implementations were removed from the active repo, shell-only scaffolding was preserved, and roadmap/status/docs were updated to reflect the rollback conservatively. Made with OpenCode.
- `2026-06-08` - `Antony Acosta` - Added step-7 implementation plan for hard reset of previously implemented backend-dependent features while preserving app shell and documentation for later reimplementation. Made with OpenCode.

## Goal

- Remove previously implemented functional features that depend on the backend so the repo returns to a clean shell state ahead of later reimplementation.
- Preserve only the app shell, empty backend scaffolding, and documentation needed to rebuild features later under the new architecture.

## Preconditions

- Step 6 has completed enough cleanup that the new backend architecture is the only active architecture baseline.
- Reimplementation is intentionally deferred; Step 7 is a rollback/reset step, not a replacement implementation step.

## In Scope

- Hard removal of previously implemented backend-dependent features from the active repo.
- Removal of Rules Catalog and all related runtime code.
- Removal of operations health command and related support code.
- Removal of authentication and authorization implementation code.
- Removal of backend entrypoints and related feature logic where those features are being reset.
- Removal of backend integrations from frontend code, including server components, where those integrations call or depend on removed backend features.
- Removal of DB/backend assets tied to removed features, including Prisma schema/migrations/backend persistence wiring when they only serve rolled-back features.
- Removal of tests for removed features.
- Removal of scripts and CLI scripts tied to removed features.
- Removal of backend utilities, validation schemas, types, contracts, and observability hooks that only support removed features.
- Documentation updates so affected features remain documented but are marked as rolled back / not currently implemented.
- Roadmap/progress documentation updates so rollback is reflected in `docs/STATUS.md` and `docs/ROADMAP.md`.

## Out Of Scope

- Theming.
- Internationalization.
- Frontend presentation code that does not implement backend integration behavior.
- Reimplementation of removed features.
- Package/dependency cleanup for backend libraries; dependencies may remain even if implementation is removed.

## Work Items

1. Identify rollback targets
   - Confirm all previously implemented backend-dependent features that must be reset.
   - Build removal list across routes, CLI, auth/session, DB, tests, scripts, and support utilities.

2. Remove backend feature implementations
   - Remove Rules Catalog implementation and related runtime code entirely from active repo.
   - Remove operations health command and any related CLI/runtime support.
   - Remove authentication/authorization implementation code, including provider wiring, middleware, session helpers, and protected-flow backend logic.
   - Remove backend endpoints and internal entry surfaces for rolled-back features.

3. Remove backend integrations from frontend/server components
   - Remove calls/imports to rolled-back backend features from UI code, including server components.
   - Preserve app shell structure and presentation where possible.
   - Remove route usage entirely unless a bare route is still needed for shell continuity.

4. Reduce remaining backend surface to shell-only scaffolding
   - Preserve empty backend architecture scaffolding introduced in prior steps.
   - Remove routes entirely unless they are needed by shell/app structure.
   - Where a route must remain, return `501 Not Implemented`.

5. Remove feature-specific data/test/script/support assets
   - Remove feature-specific Prisma schema areas, migrations, persistence code, and backend data support that only serve rolled-back features.
   - Remove tests covering deleted features.
   - Remove CLI scripts and package scripts for deleted features.
   - Remove feature-specific schemas, DTOs, utility modules, error helpers, telemetry hooks, and contracts that no longer serve active code.

6. Roll back docs without deleting them
   - Keep docs for removed features.
   - Update affected docs to a new status: `rolled back`.
   - Make clear those features are intentionally removed and planned for later reimplementation under the new architecture.

7. Update roadmap and status tracking
   - Update `docs/STATUS.md` to reflect that previously implemented backend-dependent features were rolled back.
   - Update `docs/ROADMAP.md` so implementation snapshots no longer imply those features are currently delivered.
   - Keep evidence/update notes aligned with the retained feature docs and rollback scope.

## Deliverables

- Active repo stripped of previously implemented backend-dependent features.
- App shell preserved.
- Empty backend scaffolding preserved.
- Remaining shell-required routes either removed or returning `501 Not Implemented`.
- Docs retained and marked `rolled back` where applicable.
- `docs/STATUS.md` and `docs/ROADMAP.md` updated to reflect rollback state.

## Verification Gate

- Static search confirms removed features no longer have active runtime entrypoints/import paths.
- App shell still exists and repo shape remains coherent.
- Remaining routes are either removed or intentionally return `501 Not Implemented`.
- Affected docs are retained and marked `rolled back`.
- `docs/STATUS.md` and `docs/ROADMAP.md` reflect rollback accurately and do not claim removed backend features as implemented.

## Exit Criteria

- No previously implemented backend-dependent feature remains active in the repo.
- No frontend or server-component integration still depends on removed backend functionality.
- Shell-only backend scaffolding remains for future rebuilding.
- Feature docs remain present and clearly marked as rolled back.
- Roadmap and status docs reflect the rollback without overstating active implementation.
- Non-functional shell state is acceptable and documented if build/runtime gaps remain after reset.

## Risks and Mitigations

- Risk: rollback removes structural code needed for future reimplementation.
  - Mitigation: preserve app shell and empty backend scaffolding; remove feature implementations, not framework skeleton.
- Risk: docs become misleading after code removal.
  - Mitigation: retain docs and update them to `rolled back` with explicit reimplementation intent.
- Risk: hidden backend integrations survive in server components or scripts.
  - Mitigation: require repo-wide search for imports/usages of removed backend modules and commands.

## Roadmap / Status Impact

- impacted phase(s) and expected status movement
- Update progress docs later, not in this step.
- Update `docs/STATUS.md` and `docs/ROADMAP.md` in this step to reflect rollback evidence conservatively.
