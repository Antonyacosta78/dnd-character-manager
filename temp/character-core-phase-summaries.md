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

## Phase 3 - level-up planning/finalize including multiclass

- **What changed:** Added deterministic level-planning domain logic (including multiclass confirmation requirement), implemented plan/finalize use-cases + API endpoints, and wired `LevelUpPanel` into the sheet progression section.
- **Verification run:** `bun run lint`; `bun test src/server/domain/character-core/__tests__/leveling.test.ts src/server/application/use-cases/__tests__/finalize-level-up.test.ts src/app/api/characters/[id]/level/__tests__/plan-finalize.route.test.ts`
- **Known limitations/deferred:** Required choice-node graph is currently represented as empty list; deep choice resolution is deferred to richer catalog progression modeling.

## Phase 4 - optional/variant rules + inventory/spells integration

- **What changed:** Extended draft/domain types for optional rule references + inventory/spells payloads, added validation coverage for custom/invalid row states, and introduced sheet editors plus inventory/spells update use-cases for canonical save-path integration.
- **Verification run:** `bun run lint`; `bun test src/server/domain/character-core/__tests__/validation.test.ts`
- **Known limitations/deferred:** Optional/variant selection UI is MVP-minimal and currently model-driven via refs without dedicated catalog browsing UX.

## Phase 5 - sharing + PDF export

- **What changed:** Added owner share-toggle use-case + endpoint, public read-only share-token endpoint, PDF export use-case + endpoint (`official` and `summary` modes), and sheet-side share/export action cards.
- **Verification run:** `bun run lint`; `bun test src/app/api/characters/[id]/share/__tests__/route.test.ts src/app/api/characters/[id]/export/__tests__/route.test.ts`
- **Known limitations/deferred:** Export currently uses text-backed PDF bytes until dedicated renderer is introduced.

## Phase 6 - mobile hardening + accessibility pass

- **What changed:** Hardened sheet interactions for mobile by introducing sticky bottom save CTA, tightened tap-target behavior through compact controls, and improved accessibility announcements (`aria-live` save-state updates, explicit section button labels).
- **Verification run:** `bun run lint`; `bun test src/app/(core)/characters/__tests__/character-core-mobile-smoke.test.tsx`
- **Known limitations/deferred:** Full real-device QA matrix (iOS/Android browser variance) remains a manual follow-up.

## Phase 7 - offline draft recovery + conflict resolution

- **What changed:** Extended draft store contracts with `character-sheet` scope plus base-revision/conflict metadata, added workflow selectors + conflict store tests, and integrated `ConflictResolutionDialog` with Keep Local / Keep Server / Review Differences behavior in sheet save flow.
- **Verification run:** `bun run lint`; `bun test src/client/state/__tests__/draft-store.test.ts src/client/state/__tests__/draft-store.storage.test.ts src/client/state/__tests__/draft-store.character-core-conflict.test.ts`
- **Known limitations/deferred:** Section-level diff drill-down is currently section-list only (no field-level compare view yet).

## Phase 8 - stabilization and readiness

- **What changed:** Ran full repository lint/test stabilization pass, validated all Character Core route/use-case/domain/store tests in the full suite, and executed browser smoke navigation against Character Core route path (auth guard redirect observed as expected for signed-out session).
- **Verification run:** `bun run lint && bun test`; Playwright navigation to `http://127.0.0.1:3000/characters/new` (redirected to `/sign-in` under unauthenticated state).
- **Known limitations/deferred:** Authenticated browser E2E flow and export visual fidelity checks still require seeded signed-in test account automation.
