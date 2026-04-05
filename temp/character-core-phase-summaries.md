# Character Core Phase Summaries

## Phase 0 - canonical data model + repository expansion

- **What changed:** Expanded Character Core schema for build-state notes/optional refs, inventory/spells, level history, and share settings; expanded repository port + Prisma adapter with aggregate reads, revision-guarded save, level finalize transaction, share token operations, and share-token lookup.
- **Verification run:** `bun run lint`; `bun test src/server/domain/character-core/__tests__/leveling.test.ts src/server/domain/character-core/__tests__/validation.test.ts`
- **Known limitations/deferred:** Conflict changed-section detection is heuristic; repository-focused adapter tests are still deferred.
