# Step 6 Artifact: Cutover Evidence

## Metadata

- Status: `completed`
- Created At: `2026-06-08`
- Last Updated: `2026-06-08`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-08` - `Antony Acosta` - Recorded Step 6 cutover cleanup evidence and verification notes for the current backend baseline without marking the overall rearchitecture as complete. Made with OpenCode.

## Scope Of This Evidence

- Covers Step 6 cleanup and canonical-doc alignment for the current active backend baseline only.
- Does not mark `docs/architecture/rearchitecture-proposal.md` as implemented.
- Does not claim final project-wide rearchitecture completion.
- Leaves broader feature reset and remaining deferred code removal to Step 7.

## Active Runtime Baseline After Step 6

- Active REST routes remain:
  - `GET /api/characters`
  - `POST /api/auth/register`
  - `GET /api/auth/[...all]` returning intentional `501`
  - `POST /api/auth/[...all]` returning intentional `501`
- No active CLI scripts remain in `package.json` for deprecated catalog/import commands.
- Active `src/app/**` and `src/server/entrypoint/**` runtime paths no longer import legacy `application`, `adapters`, `ports`, or `composition` paths directly.

## Legacy Runtime Paths Removed In Step 6

- `src/server/application/errors/auth-errors.ts`
- `src/server/application/use-cases/list-owner-characters.ts`
- `src/server/application/use-cases/__tests__/list-owner-characters.authz.test.ts`
- `src/server/adapters/auth/auth-session-context.ts`
- `src/server/adapters/auth/__tests__/auth-session-context.test.ts`
- `src/server/adapters/prisma/character-repository.ts`
- `src/server/ports/character-repository.ts`
- `src/server/ports/session-context.ts`
- `src/server/composition/create-app-services.ts`

## Canonical Docs Updated In Step 6

- `docs/architecture/back-end-architecture.md`
- `docs/architecture/app-architecture.md`
- `docs/architecture/api-error-contract.md`

## Verification Commands

- `bun run lint`
- `bun run build`
- `bun test`

## Verification Results

- `bun run lint`: passed
- `bun run build`: passed
- `bun test`: passed (`216 pass`, `0 fail`)

## Manual Alignment Notes

- `GET /api/characters` remains transport-safe through REST entrypoint mapping and middleware/orchestration boundaries.
- `POST /api/auth/register` remains transport-safe through schema validation middleware, orchestration classification, and REST mapping.
- `GET/POST /api/auth/[...all]` intentionally return `501 Not Implemented` as part of the current cutover/reset baseline.
- No active CLI contract remains in the current baseline, so CLI transport validation is intentionally out of Step 6 scope.
- No active server-function contract remains in the current baseline, so server-function transport validation is intentionally out of Step 6 scope.

## Remaining For Step 7

- Remove or roll back broader backend-dependent feature code beyond the current active baseline.
- Remove deferred catalog/import runtime code that is no longer wanted in the active repo.
- Remove remaining legacy directories and tests that are intentionally left outside Step 6 because they belong to the planned rollback/reset phase.
- Update feature docs to `rolled back` where Step 7 removes active functionality.
