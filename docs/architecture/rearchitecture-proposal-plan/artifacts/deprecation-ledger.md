# Step 2 Artifact: Deprecation Ledger

## Metadata

- Status: `ready`
- Created At: `2026-06-07`
- Last Updated: `2026-06-07`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-07` - `Antony Acosta` - Added the Step 2 deprecation ledger for legacy backend paths and deferred catalog/import runtime pieces. Made with OpenCode.

## Ledger

| Legacy path | Current role | Decision | Successor or archive target | Owner | Removal gate |
| --- | --- | --- | --- | --- | --- |
| `src/server/application/**` | Legacy application/use-case layer and app-specific error types | Remove after migration | `src/server/orchestration/**` for operation coordination and `src/server/core/**` for pure business logic | `Antony Acosta` | All rows that still import `src/server/application/**` are migrated, and no runtime imports remain |
| `src/server/adapters/auth/**` | Better Auth session lookup plus caller admin lookup | Remove after migration | `src/server/services/session-service/**` plus entrypoint middleware under `src/server/middleware/**` | `Antony Acosta` | Session and caller resolution happen only through Session Service, and no app/api/orchestration code imports adapter classes directly |
| `src/server/adapters/prisma/**` | Direct Prisma-backed repositories and client wiring | Remove after migration | `src/server/services/db-service/**` with repository classes behind the DB Service boundary | `Antony Acosta` | Database access occurs only through DB Service, and no route/orchestrator imports Prisma adapters directly |
| `src/server/adapters/rules-catalog/**` | Catalog runtime readers and provider implementations | Move to `_deprecated` | `_deprecated/src/server/adapters/rules-catalog/**` | `Antony Acosta` | No active runtime import remains, and every catalog-dependent surface is archived or removed from active scope |
| `src/server/ports/**` | Hexagonal contracts for repositories, rules catalog, and session context | Remove entirely | Contracts live with new services and layer-local typed inputs/outputs as needed | `Antony Acosta` | No runtime code imports `src/server/ports/**`, and tests are updated to the new contracts |
| `src/server/composition/**` | Legacy wiring/config/composition layer | Remove after migration | Minimal wiring moves to the new entrypoint/service structure; catalog-specific composition moves to `_deprecated` with catalog work | `Antony Acosta` | No runtime code depends on `create-app-services.ts`, `rules-catalog-factory.ts`, or composition-layer factories |
| `src/server/import/**` | Import, resolve, normalize, validate, fingerprint, and publish runtime pipeline | Move to `_deprecated` | `_deprecated/src/server/import/**` | `Antony Acosta` | No active CLI, route, or server-side caller depends on import/catalog runtime code |
| `src/server/cli/**` | Legacy CLI transport layer | Remove from active runtime scope | Active CLI work belongs in `src/server/entrypoint/cli/**`; current catalog/import CLI files move to `_deprecated` | `Antony Acosta` | No package script points to `src/server/cli/**`, and any surviving CLI operation is reintroduced from `src/server/entrypoint/cli/**` |

## Path-Specific Notes

- `src/server/composition/app-config.ts` should not survive under the `composition` boundary name, even if its runtime config behavior is kept.
- `src/server/cli/response-meta.ts` is only a helper for deprecated catalog/import CLI flows in the current repo state and should leave active runtime scope with those commands.
- `src/server/adapters/rules-catalog/**`, `src/server/import/**`, and current catalog-related CLI surfaces are grouped together intentionally because the proposal defers them out of active runtime scope instead of migrating them now.
