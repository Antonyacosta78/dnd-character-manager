# Character Core Phase Summaries

## Phase 0 - canonical data model + repository expansion

- **What changed:** Expanded Character Core schema for build-state notes/optional refs, inventory/spells, level history, and share settings; expanded repository port + Prisma adapter with aggregate reads, revision-guarded save, level finalize transaction, share token operations, and share-token lookup.
- **Verification run:** `bun run lint`; `bun test src/server/domain/character-core/__tests__/leveling.test.ts src/server/domain/character-core/__tests__/validation.test.ts`
- **Known limitations/deferred:** Conflict changed-section detection is heuristic; repository-focused adapter tests are still deferred.

## Phase 1 - create + first save vertical slice

- **What changed:** Completed builder Step 1 flow (`/characters/new` + `CharacterBuilderStepOne`), added authenticated class-options route, implemented create/save/get character use-cases with warning acknowledgment + conflict error details, and wired `/api/characters` + `/api/characters/[id]` create/read/save endpoints.
- **Verification run:** `bun run lint`; `bun test src/app/api/characters/__tests__/route.test.ts src/app/api/characters/[id]/__tests__/route.test.ts src/server/application/use-cases/__tests__/save-character-canonical.test.ts`
- **Known limitations/deferred:** Creation completion analytics is still placeholder-only pending analytics infrastructure.

## Phase 2 - free-edit sheet structure + validation surfaces

- **What changed:** Replaced sheet placeholder with `CharacterSheetLayout` (sticky summary, section navigation, editable core/notes sections), wired validation summary with explicit warning acknowledgments, and connected save-state indicators to draft store envelope state.
- **Verification run:** `bun run lint`; `bun test src/app/(core)/characters/__tests__/character-core-mobile-smoke.test.tsx`
- **Known limitations/deferred:** Field-level focus jump on validation errors is still a follow-up; current UI keeps summary-first presentation.
