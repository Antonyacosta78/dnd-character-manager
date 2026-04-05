# Implementation Status

This document tracks implementation progress against `docs/ROADMAP.md`.

Status values:

- `completed`: MVP scope for the phase is implemented and wired
- `in-progress`: active implementation exists, but MVP is not complete yet
- `planned`: documented intent exists, implementation not started yet
- `blocked`: phase cannot proceed due to an external or sequencing blocker
- `unknown`: not enough evidence to classify confidently

Checklist markers:

- `[x]` done
- `[~]` in progress
- `[ ]` not started

## Snapshot

- Last verified: 2026-04-05
- Evidence method: docs + code audit (high-confidence only)

## Phase Checklist

### Phase 0 - Foundation

- Status: `completed`
- Confidence: `high`
- Checklist
  - [x] Product and architecture direction documented
  - [x] Feature/spec workflow and templates in place
  - [x] Rules import and catalog publish foundation wired
  - [x] i18n foundation wired for `en` and `es`
  - [x] Arcane Codex design-system foundation reference slice implemented (tokens, primitives, domain/pattern components, split workbench/codex routes)
  - [x] Global state management foundation (architecture/spec + store, persistence, provider wiring, and tests)
  - [x] Operations health command wired (`ops-catalog-health`)
- Evidence
  - `docs/architecture/feature-workflow.md`
  - `docs/specs/foundation/implementation-plan.md`
  - `docs/architecture/global-state-management.md`
  - `docs/specs/foundation/global-state-management-implementation-plan.md`
  - `docs/specs/design-system/implementation-plan.md`
  - `docs/specs/design-system/foundation.md`
  - `src/app/globals.css`
  - `src/app/layout.tsx`
  - `src/app/workbench/page.tsx`
  - `src/app/codex/page.tsx`
  - `src/app/ui/sandbox/page.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/domain/ability-block.tsx`
  - `src/components/patterns/stat-grid.tsx`
  - `.rulesync/rules/25-global-state-management.md`
  - `src/client/state/draft-store.ts`
  - `src/client/state/draft-store.storage.ts`
  - `src/client/state/draft-store.provider.tsx`
  - `src/client/state/__tests__/draft-store.test.ts`
  - `src/client/state/__tests__/draft-store.storage.test.ts`
  - `src/app/draft-store-demo.tsx`
  - `src/server/import/run-import-pipeline.ts`
  - `src/server/cli/data-import.ts`
  - `src/server/adapters/rules-catalog/derived-rules-catalog.ts`
  - `src/i18n/index.ts`
  - `package.json`
  - `src/server/cli/ops-catalog-health.ts`

### Phase 1 - Character Core

- Status: `planned`
- Confidence: `high`
- Checklist
  - [ ] Character creation and base identity fields
  - [ ] 5e 2014 stat-generation paths
  - [ ] Character status lifecycle support
  - [ ] Mechanical template duplication flow
- Evidence
  - `docs/ROADMAP.md`

### Phase 2 - Global Settings

- Status: `completed`
- Confidence: `high`
- Checklist
  - [x] Global Settings modal exists in primary navigation with section navigation + content panel layout
  - [x] User-level preferences are centralized here (theme and language included in MVP scope)
  - [x] Preference persistence + hydration is deterministic with fallback
  - [x] Scope stays global-only (no character/world/game-specific overrides)
- Evidence
  - `docs/ROADMAP.md`
  - `docs/features/global-settings.md`
  - `docs/specs/global-settings/foundation.md`
  - `docs/specs/global-settings/implementation-plan.md`
  - `src/components/patterns/surface-shell.tsx`
  - `src/components/settings/global-settings-modal.tsx`
  - `src/components/settings/theme-settings-panel.tsx`
  - `src/components/settings/language-settings-panel.tsx`
  - `src/components/settings/setting-save-feedback.tsx`
  - `src/client/state/global-settings.types.ts`
  - `src/client/state/global-settings.store.ts`
  - `src/client/state/global-settings.provider.tsx`
  - `src/client/state/global-settings.theme-storage.ts`
  - `src/client/state/global-settings.theme-apply.ts`
  - `src/client/state/global-settings.locale-bridge.ts`
  - `src/client/state/__tests__/global-settings.store.test.ts`
  - `src/client/state/__tests__/global-settings.theme-storage.test.ts`
  - `src/components/settings/__tests__/setting-save-feedback.test.tsx`

### Phase 3 - Progression Planning

- Status: `planned`
- Confidence: `high`
- Checklist
  - [ ] Level-by-level planning to target level `N`
  - [ ] Partial future planning support
  - [ ] Derived value recalculation
  - [ ] Multiclass and feature-choice support
- Evidence
  - `docs/ROADMAP.md`

### Phase 4 - Branching And Timelines

- Status: `planned`
- Confidence: `high`
- Checklist
  - [ ] Main progression with branch creation from prior levels
  - [ ] Branch world-lock behavior
  - [ ] Earlier-level edits recalculate downstream levels
  - [ ] Invalid-level repair guidance
- Evidence
  - `docs/ROADMAP.md`

### Phase 5 - Games, Worlds, And Snapshots

- Status: `planned`
- Confidence: `high`
- Checklist
  - [ ] World and game creation
  - [ ] Assign character flow for sessions
  - [ ] Frozen snapshots from branch + level
  - [ ] Snapshot history linked to games
- Evidence
  - `docs/ROADMAP.md`

### Phase 6 - Playable Output

- Status: `planned`
- Confidence: `high`
- Checklist
  - [ ] Generate playable level output
  - [ ] Support 4-page 5e printable sheet
  - [ ] Export clean PDF
  - [ ] Desktop-first readability with acceptable mobile support
- Evidence
  - `docs/ROADMAP.md`

### Phase 7 - Roster And Navigation

- Status: `planned`
- Confidence: `high`
- Checklist
  - [ ] Character search and recent-use views
  - [ ] Grouping by world
  - [ ] Filter system for core fields
  - [ ] Highlight commonly used versions
- Evidence
  - `docs/ROADMAP.md`

### Phase 8 - History And Comparison

- Status: `planned`
- Confidence: `high`
- Checklist
  - [ ] Branch history with games and sessions
  - [ ] Chronology inference and manual ordering
  - [ ] Level/version diffs
  - [ ] Optional notes on branches and versions
- Evidence
  - `docs/ROADMAP.md`

## Update Cadence

- Update this file whenever roadmap-relevant docs or implementation land.
- Prefer evidence-backed status changes over optimistic guesses.
- If confidence is low, set status to `unknown` and call out what is missing.
