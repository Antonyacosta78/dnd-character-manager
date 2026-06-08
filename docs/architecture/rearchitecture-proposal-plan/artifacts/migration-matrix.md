# Step 2 Artifact: Migration Matrix

## Metadata

- Status: `ready`
- Created At: `2026-06-07`
- Last Updated: `2026-06-07`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-07` - `Antony Acosta` - Added the Step 2 backend surface inventory and migration matrix from the current repo state. Made with OpenCode.

## Scope Freeze

- This matrix inventories the real backend surfaces currently present in the repo.
- The target architecture is a full rewrite with no coexistence fallback.
- Legacy backend docs are treated as superseded when the rearchitecture implementation closes.
- `src/server/import/**` and catalog runtime work are deferred from active runtime scope and should be sent to `_deprecated` rather than migrated as first-class backend runtime paths.
- Target mappings use provisional operation-aligned filenames. Step 3 may adjust exact filenames while preserving the layer ownership and path family recorded here.

## Inventory Summary

- REST route modules found: 3
- REST method surfaces found: 4
- CLI entrypoints found: 3
- `"use server"` files found under `src/**/*`: 0
- Direct server-side callers outside formal entrypoints found: 2
- Legacy backend folders under `src/server/**`: `adapters/`, `application/`, `cli/`, `composition/`, `import/`, `ports/`
- Legacy application operations under `src/server/application/use-cases/**`: `list-owner-characters`, `load-draft`, `save-draft`

## Direct Server-Side Callers Outside Formal Entrypoints

| Caller | Current backend access | Migration implication |
| --- | --- | --- |
| `src/app/(core)/characters/page.tsx` | Directly instantiates `AuthSessionContext`, `createPrismaCharacterRepository`, and `createListOwnerCharactersUseCase` | Replace with a Server Function entrypoint if this non-REST caller remains after migration |
| `src/app/(core)/layout.tsx` | Directly calls `new AuthSessionContext().getSessionContext()` for auth gating | Replace with Session Service consumption behind approved server-side entry or shared auth boundary |

## Migration Rows

| ID | Current operation | Current surface(s) | Legacy implementation | Target mapping | Requirements | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| `MM-01` | List owner characters | `GET /api/characters`<br>`src/app/(core)/characters/page.tsx` direct server-side caller | `src/app/api/characters/route.ts`<br>`src/server/application/use-cases/list-owner-characters.ts`<br>`src/server/adapters/auth/auth-session-context.ts`<br>`src/server/adapters/prisma/character-repository.ts` | Entrypoint: `src/server/entrypoint/api/characters.ts#GET`<br>Optional non-REST caller: `src/server/entrypoint/server-function/characters/list.ts`<br>Orchestration: `src/server/orchestration/character/list-owner-characters.ts`<br>Core: `src/server/core/character/list-owner-characters.ts`<br>Services: `src/server/services/session-service/**`, `src/server/services/db-service/**` | Authentication required; admin override authorization; no request body validation | Active migration row. Current route and server component both bypass target boundary rules |
| `MM-02` | Register account and create session | `POST /api/auth/register` | `src/app/api/auth/register/route.ts`<br>`src/auth.ts` | Entrypoint: `src/server/entrypoint/api/auth/register.ts#POST`<br>Orchestration: `src/server/orchestration/auth/register.ts`<br>Core: `src/server/core/auth/register.ts`<br>Services: `src/server/services/session-service/**` | Public route; request-body validation for `username`, `password`, `email`; duplicate username and password-constraint handling | Active migration row. Current route owns validation, provider calls, session creation, and error mapping directly |
| `MM-03` | Better Auth catch-all GET transport | `GET /api/auth/[...all]` | `src/app/api/auth/[...all]/route.ts`<br>`src/auth.ts` | Entrypoint: replace with explicit `src/server/entrypoint/api/auth/**` GET endpoints<br>Orchestration: `src/server/orchestration/auth/**` per endpoint<br>Core: `src/server/core/auth/**` per endpoint<br>Services: `src/server/services/session-service/**` | Provider-owned auth transport; exact sub-operations are opaque from repo-visible code | Blocked row. Proposal requires replacing provider-owned catch-all routing with in-house endpoints |
| `MM-04` | Better Auth catch-all POST transport | `POST /api/auth/[...all]` | `src/app/api/auth/[...all]/route.ts`<br>`src/auth.ts` | Entrypoint: replace with explicit `src/server/entrypoint/api/auth/**` POST endpoints<br>Orchestration: `src/server/orchestration/auth/**` per endpoint<br>Core: `src/server/core/auth/**` per endpoint<br>Services: `src/server/services/session-service/**` | Provider-owned auth transport; exact sub-operations are opaque from repo-visible code | Blocked row. Proposal requires replacing provider-owned catch-all routing with in-house endpoints |
| `MM-05` | Load draft | No active route, CLI, or server-function caller found | `src/server/application/use-cases/load-draft.ts`<br>`src/server/ports/draft-repository.ts` | Entrypoint: `src/server/entrypoint/server-function/draft/load.ts` if retained<br>Orchestration: `src/server/orchestration/draft/load.ts`<br>Core: `src/server/core/draft/load.ts`<br>Services: `src/server/services/db-service/**` | Caller and transport still undefined; current implementation is a thin persistence pass-through | Legacy operation with no active entrypoint. Keep mapped, but do not migrate until a caller is confirmed |
| `MM-06` | Save draft | No active route, CLI, or server-function caller found | `src/server/application/use-cases/save-draft.ts`<br>`src/server/ports/draft-repository.ts` | Entrypoint: `src/server/entrypoint/server-function/draft/save.ts` if retained<br>Orchestration: `src/server/orchestration/draft/save.ts`<br>Core: `src/server/core/draft/save.ts`<br>Services: `src/server/services/db-service/**` | Caller and transport still undefined; current implementation is a thin persistence pass-through | Legacy operation with no active entrypoint. Keep mapped, but do not migrate until a caller is confirmed |
| `MM-07` | Compute dataset fingerprint | CLI script `data:fingerprint` -> `src/server/cli/data-fingerprint.ts` | `src/server/cli/data-fingerprint.ts`<br>`src/server/import/fingerprint/compute-dataset-fingerprint.ts`<br>`src/server/composition/app-config.ts` | Active runtime target: none<br>Archive target: `_deprecated/src/server/cli/data-fingerprint.ts` and `_deprecated/src/server/import/**` | Environment-backed CLI; file-system validation; catalog/import only | Deferred archive row. Proposal says catalog/import work leaves active runtime scope |
| `MM-08` | Run import pipeline | CLI script `data:import` -> `src/server/cli/data-import.ts` | `src/server/cli/data-import.ts`<br>`src/server/import/run-import-pipeline.ts`<br>`src/server/adapters/prisma/catalog-import-run-repository.ts`<br>`src/server/adapters/prisma/catalog-publish-repository.ts` | Active runtime target: none<br>Archive target: `_deprecated/src/server/cli/data-import.ts` and `_deprecated/src/server/import/**` | Environment-backed CLI; DB write path; deferred catalog/import subsystem | Deferred archive row. Proposal explicitly sends import/catalog work out of active runtime scope |
| `MM-09` | Catalog health placeholder | CLI script `ops:catalog:health` -> `src/server/cli/ops-catalog-health.ts` | `src/server/cli/ops-catalog-health.ts`<br>`src/server/cli/response-meta.ts` | Active runtime target: none<br>Archive target: `_deprecated/src/server/cli/ops-catalog-health.ts` | Placeholder only; no real use-case implementation exists | Deferred archive row. Do not implement under the new active backend scope |

## Coverage Notes

- No `"use server"` files were found, so there are no current Server Function entrypoints to map one-to-one.
- The direct server-side calls in `src/app/(core)/**` are inventory findings, not approved long-term entrypoints.
- No `src/server/domain/**` folder exists in the current repo state, so there is no separate domain-layer inventory to carry forward.
- The Better Auth catch-all route is inventoryable only as `GET` and `POST` transport surfaces because the provider-owned sub-operations are not expressed as repo-local backend modules.
