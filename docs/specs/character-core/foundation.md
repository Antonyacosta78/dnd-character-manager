# Spec: Character Core Foundation

## Metadata

- Status: `proposed`
- Created At: `2026-04-05`
- Last Updated: `2026-04-05`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-05` - `Antony Acosta` - Added migration note after global-state architecture alignment so Character Core conflict handling is anchored to the shared explicit-choice baseline and no longer tracked as an open architecture mismatch.
- `2026-04-05` - `Antony Acosta` - Created the Character Core foundation spec with MVP-first domain contracts for create/edit/level/save, rules-catalog-driven validation, offline conflict handling, sharing, and export boundaries so implementation planning can proceed with a single technical source of truth. (Made with OpenCode)

## Related Feature

- `docs/features/character-core.md`

## Context

- Character Core is the first player-facing persistent domain slice for signed-in 5e (2014) PCs.
- The highest delivery risk is behavior drift across builder UX, free-edit, progression logic, local draft behavior, and server persistence.
- This spec defines the minimum stable technical contract for MVP so implementation can move quickly without fragmenting rules logic between UI, app services, and storage adapters.

## Scope Boundaries and Non-Goals

### In Scope (MVP)

- PC-only character lifecycle: create -> edit -> level -> save.
- Rules-catalog-driven 2014 class/race/background/feature/feat/spell usage, including official optional/variant player-facing rules present in the active catalog dataset.
- Guided builder start step (concept + initial mechanics) and transition into free edit.
- Multiclass-aware leveling with explicit player confirmation before class change.
- Inventory and spell management in the core character sheet.
- Local draft persistence for offline resilience and reconnect conflict handling.
- Owner-controlled read-only sharing.
- PDF export in two formats (official-like parity form, app-styled summary).

### Out of Scope (MVP)

- 2024 rules content.
- NPC/monster sheet workflows.
- Real-time co-editing.
- Full homebrew system authoring.
- Share-link expiration policy.
- Campaign journaling/log timeline systems.

## Domain Model / Entities

### Canonical Server Entities

1. **Character**
   - Identity and ownership: `id`, `ownerUserId`, `name`, `status`, `createdAt`, `updatedAt`.
   - Core profile fields for sheet rendering and progression context.
   - Persisted only through application-layer use-cases.

2. **CharacterBuildState**
   - Current mechanical choices (class levels, subclass, race/background, ability setup, selected features/feats/spells, optional/variant selections).
   - Stores catalog references by stable identity (`name + source` or equivalent catalog identity key), not UI labels.

3. **CharacterLevelHistoryEntry**
   - Immutable per-level continuity record: `levelNumber`, selected class, deterministic outcomes applied, choice outcomes selected, timestamp.
   - Used for continuity/readability and conflict review context.

4. **CharacterInventoryEntry**
   - Supports catalog-linked or custom item entries.
   - Minimum fields: `label`, `quantity`, `carriedState`, optional `weight`, optional notes, optional catalog reference.

5. **CharacterSpellEntry**
   - Supports prepared/known/always-available style states based on class feature grants.
   - Includes optional custom spell entries for light player notes/home table adjustments.

6. **CharacterShareSettings**
   - `shareEnabled` boolean + current active read token metadata.
   - Toggle controls access; disabled state must immediately revoke prior token access.

### Client Draft Entity (Non-Canonical)

7. **CharacterDraftEnvelope**
   - Local-only recoverable state for unsaved edits.
   - Required fields: `scope`, `characterId`, `schemaVersion`, `updatedAt`, `data`, `isDirty`, optional `baseRevision`.
   - Lives in global draft store; never treated as canonical truth.

## Behavior Contracts

### Create Contract

1. Creation requires authenticated user context.
2. Guided builder first step captures both:
   - concept text fields (for player intent), and
   - initial mechanics (at minimum class and level-1 setup primitives).
3. Quick-start preset selection is optional and must remain reversible before first save.
4. First successful save writes a canonical `Character` plus initial `CharacterBuildState`; local draft remains until save acknowledgment then is marked clean.

### Edit Contract

1. Free-edit sheet can modify supported core fields, inventory, spells, optional/variant selections, and light custom entries.
2. Edits apply to local draft first; explicit save writes canonical changes.
3. Failed save never drops draft data.

### Level Contract (Single Class and Multiclass)

1. Level action requires a current valid character base state.
2. Deterministic outcomes auto-apply (for example proficiency bonus progression or fixed feature grants).
3. Choice-based outcomes must block finalize until user confirms selections.
4. For multiclass-capable characters:
   - default suggestion is current primary class progression,
   - class-change requires explicit confirmation,
   - resulting grants/eligibility must resolve against active catalog data.
5. Level finalize writes a new `CharacterLevelHistoryEntry` and updates `CharacterBuildState` atomically.

### Optional/Variant Rule Handling Contract

1. Optional/variant player-facing 2014 rules are catalog-driven, not hardcoded in UI components.
2. If active catalog includes optional path entries, UI must surface them as selectable options during relevant build/progression flows.
3. If catalog data needed for a selected rule is unavailable/mismatched, operation fails with contract-aligned unavailable/mismatch semantics; no silent fallback.

### Save Contract

1. Save operations enforce authn/authz before repository access.
2. Save writes are version-aware (revision or timestamp guarded) so stale writes can be detected.
3. On successful save, draft is marked clean with updated base revision.

## Validation and Override Behavior

### Validation Levels

- **Hard validation (blocking):** malformed payloads, invalid ownership, missing required baseline identity/mechanical anchors, impossible catalog references.
- **Soft validation (non-blocking):** rule inconsistencies that can be player-intent overrides (for example unusual but intentional combinations).

### Override Contract

1. Soft validation issues are returned as explicit warning objects with stable `code`, `path`, `message`, and optional `catalogContext`.
2. User may proceed by recording an override acknowledgment for specific warning codes.
3. Overrides must persist with the character record so warnings are not repeatedly re-blocking.
4. Hard validation cannot be overridden.

## Inventory and Spells Contracts (In-Core)

### Inventory

- Inventory edits are part of Character Core saves (no separate feature boundary in MVP).
- Must support add/edit/remove and quantity adjustments.
- Must support both catalog-linked and custom entries without breaking validation flow.

### Spells

- Spells are stored as explicit character spell entries, not recomputed-only transient UI state.
- Spell eligibility/options must come from active rules catalog + character build context.
- Custom spell notes/entries are allowed as light custom data and must be clearly marked as custom.

## Sharing and PDF Export Contracts

### Sharing

1. Owner can enable/disable read-only share access per character.
2. Shared viewers receive read-only projection; mutation endpoints/actions must reject viewer attempts.
3. Disabling share revokes active token immediately for subsequent requests.

### PDF Export

1. Two output modes:
   - official-like field-parity familiarity sheet,
   - app-styled summary sheet.
2. Export source is canonical saved character state (not unsaved local draft).
3. Export response must indicate failure reason when required data is missing; no partial silent PDFs.

## Mobile, Offline Drafts, and Conflict Resolution

1. Mobile is first-class for create/edit/level/save; no desktop-only required interactions.
2. Local draft cache is required for unsaved edits and offline interruptions.
3. When reconnect/save detects server revision mismatch against draft base revision, show explicit conflict resolution prompt with three actions:
   - Keep Local (overwrite server with local draft),
   - Keep Server (discard local draft),
   - Review Differences (compare changed sections before choosing).
4. Conflict prompt must be clear and non-destructive by default (no silent merge).
5. Local draft parse/migration failures must fail open for page load and fail closed for invalid draft application, with recoverable user notice.

## API / Use-Case Boundaries and Error Contract Expectations

### Application Boundary

- UI calls application-layer use-cases (via server actions and/or route handlers).
- Use-cases orchestrate repositories + rules catalog ports.
- Domain logic and rules evaluation stay out of UI components and client stores.

### Expected Use-Cases (MVP)

- `createCharacter`
- `updateCharacterDraftToCanonical` (save)
- `planLevelUp` / `finalizeLevelUp`
- `updateInventory`
- `updateSpells`
- `setCharacterShareEnabled`
- `exportCharacterPdf`

### Error Contract Expectations

- Align transport envelopes and safe error behavior with `docs/architecture/api-error-contract.md`.
- Expected code usage in this slice:
  - `AUTH_UNAUTHENTICATED` (`401`)
  - `AUTH_FORBIDDEN` (`403`)
  - `REQUEST_VALIDATION_FAILED` (`400`) for hard-validation payload failures and unresolved required choices
  - `RULES_CATALOG_UNAVAILABLE` / `RULES_CATALOG_DATASET_MISMATCH` (`503`) when rules backing data cannot safely resolve
  - `INTERNAL_ERROR` (`500`) for unexpected failures
- Conflict detection responses must be explicit and machine-readable via error `details` payload (for prompt branching) without leaking internals.

## State Management Boundaries (Global vs Character/Draft)

1. Canonical character state is server-owned.
2. Global client store owns only workflow/draft concerns (dirty state, local draft payload, restore banners, conflict UI state).
3. Route params own shareable view state (tabs/filters/mode), not canonical mechanics.
4. Component-local state owns ephemeral presentational toggles.
5. Client store must not perform domain-rule computation beyond UI convenience transforms.

## Acceptance Criteria and Verification Notes

### Acceptance Criteria (Implementation-Ready)

1. Signed-in player can create and save a 2014 PC end-to-end from guided start to persisted sheet.
2. Guided start can transition to free edit without data loss.
3. Level-up auto-applies deterministic changes and blocks on unresolved choices.
4. Multiclass level-up requires explicit class-change confirmation.
5. Inventory and spells edits persist correctly across reload/re-login.
6. Optional/variant 2014 rules present in active catalog are available in relevant flows.
7. Soft validation warnings are visible and overridable; hard validation remains blocking.
8. Owner can enable/disable read-only sharing; shared viewers cannot edit.
9. Both PDF formats export from saved state.
10. Offline draft recovery works after refresh/reconnect.
11. Conflict prompt presents Keep Local / Keep Server / Review Differences actions.

### Verification Notes (Minimum)

- Domain tests: leveling determinism, multiclass confirmation gate, validation severity behavior.
- Application tests: auth/ownership guards, catalog-unavailable handling, conflict detection branching.
- Store/integration tests: local draft rehydrate, save success clean-marking, conflict prompt trigger conditions.
- E2E smoke: mobile viewport create/edit/level/save + share read-only + both PDF exports.

## Open Questions

- None currently.

## Policy Migration Note

- Global conflict policy has been aligned in `docs/architecture/global-state-management.md`: user-authored, draft-backed canonical records now use explicit conflict resolution (Keep Local / Keep Server / Review Differences) with machine-readable conflict details.
- Character Core adopts this as baseline behavior (not a feature-only exception).
- Timestamp LWW remains limited to low-stakes non-canonical state as defined by the architecture note.

## Related Docs

- `docs/features/character-core.md`
- `docs/architecture/app-architecture.md`
- `docs/architecture/global-state-management.md`
- `docs/architecture/catalog-storage-and-read-model.md`
- `docs/architecture/api-error-contract.md`
- `docs/specs/authentication/foundation.md`
- `docs/specs/rules-catalog/catalog-publish-and-rules-catalog-interface.md`

## Related Implementation Plan

- `docs/specs/character-core/implementation-plan.md` (to be created)
