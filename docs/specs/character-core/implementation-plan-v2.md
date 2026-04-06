# Implementation Plan: Character Core (Update v2)

## Metadata

- Status: `ready`
- Created At: `2026-04-06`
- Last Updated: `2026-04-06`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-06` - `Antony Acosta` - Created v2 update plan to continue from implemented Character Core baseline toward DMV-inspired workbench UX parity (step rail, action rail, pulse panel, mode split, selections drawer) with merge-safe execution waves and regression guardrails.

## Purpose of v2 (Update Scope)

This plan does **not** restart Character Core. It captures what is already shipped on `feature/character-core`, identifies remaining gaps against the updated UX contract, and defines the smallest safe execution path to reach the new workbench target.

Primary references:

- `docs/specs/character-core/implementation-plan.md`
- `docs/specs/character-core/ux-guide.md`
- `docs/specs/character-core/foundation.md`
- `docs/features/character-core.md`
- `temp/character-core-phase-summaries.md`
- `temp/character-core-open-issues.md`

## Current-State Snapshot (Implemented vs Incomplete)

### Implemented baseline (already in branch)

- ✅ Canonical Character Core persistence, revision-guarded saves, share token flow, and export endpoints.
- ✅ Guided create step (`/characters/new`) and free-edit sheet (`/characters/[id]`) are working.
- ✅ Save pipeline with hard issues + soft warning acknowledgment contract.
- ✅ Level-up plan/finalize endpoints with multiclass confirmation gate and history write path.
- ✅ Inventory and spells editors integrated into core save path.
- ✅ Conflict modal with explicit `Keep Local`, `Keep Server`, `Review Differences` actions.
- ✅ Mobile baseline hardening and a11y improvements (live save-state announcements, tap-target hardening).
- ✅ Stabilization pass completed with lint/tests run and signed-out Playwright smoke redirect check.
- ✅ Known bugfixes landed for create/save reliability and level regression synchronization (`character-sheet-layout.level-sync.test.ts`).

### Incomplete / deferred vs updated UX direction

- ⏳ Shared workbench shell parity is partial; current UI is still tab/form-led, not full step-rail canvas model.
- ⏳ Sticky action rail is not yet unified across create/edit with full action set (`Back/Next/Quick Start/Randomize/Export/Share/Save state`).
- ⏳ Pulse panel parity is limited; no complete always-on mechanics pulse with source-step causality.
- ⏳ Build/Story mode split exists conceptually but not as a first-class shell mode contract.
- ⏳ Selections drawer / timeline is not implemented yet.
- ⏳ Conflict diff is section-level only (no field-level drill-down).
- ⏳ Optional/variant catalog UX remains minimal (ref-driven, no rich browse/explain flow).
- ⏳ Analytics event is placeholder-only (AC13 dependency).
- ⏳ PDF output is transport-compatible placeholder bytes pending renderer.

## Gap Analysis

### 1) Code architecture gaps

- Shell composition is concentrated in `CharacterSheetLayout` and builder step component, limiting shared “single workbench” behavior.
- Step-oriented navigation model is not yet a first-class state contract across create/edit.
- Current save/conflict handling is solid but needs tighter integration with future multi-region workbench state (canvas + rails + drawer).

### 2) UX contract gaps (from updated UX guide)

- Missing complete desktop 3-region shell behavior (step rail + active canvas + sticky pulse panel).
- Missing mobile shell parity for segmented step rail + bottom-sheet pulse + sticky bottom action cluster.
- Missing explicit Build/Story mode persistence and reduced-context rendering rules.
- Missing progressive disclosure utilities (`Show Info`, `Show Selections`) tied to step context.

### 3) Quality and trust gaps

- Field-level focus jump from validation summary to first invalid input still pending.
- Conflict review depth needs field/row diff drill-down before destructive choices.
- Regression guardrails need expansion for create/save bugfix path and level sync invariants.
- Not-found error code harmonization remains imperfect on some routes (`404` with `REQUEST_VALIDATION_FAILED`).

## Prioritized Execution Waves (Merge-Safe)

### Wave 1 — Workbench shell foundation (shared create/edit frame)

**Goal:** Introduce a reusable shell contract without rewriting domain behavior.

- Add shared `CharacterWorkbenchShell` layout primitive (action rail, step rail, canvas slot, pulse slot, mode slot, selections slot).
- Keep existing business logic/endpoints untouched; move composition boundaries only.
- Preserve existing tabs/forms as internal canvas content to stay merge-safe.

Likely files to touch:

- `src/components/character-core/character-sheet-layout.tsx`
- `src/components/character-core/character-builder-step-one.tsx`
- `src/app/(core)/characters/new/page.tsx`
- `src/app/(core)/characters/[id]/page.tsx`
- `src/components/character-core/*` (new shell component file(s))

Candidate tests:

- `src/app/(core)/characters/__tests__/character-core-mobile-smoke.test.tsx`
- `src/components/character-core/__tests__/character-sheet-layout.level-sync.test.ts`
- New: `src/components/character-core/__tests__/character-workbench-shell.test.tsx`

Suggested commit boundary:

1. `feat(character-core): add shared workbench shell scaffolding for create/edit`

Merge safety: **Yes** (UI composition only; core save/level logic unchanged).

---

### Wave 2 — Step rail + action rail + pulse panel parity uplift

**Goal:** Make shell behavior align to UX wireframe contracts.

- Implement step rail completion/warning badges and active-step navigation.
- Implement sticky action rail contract (desktop top rail + mobile bottom primary/overflow).
- Build pulse panel with mechanical anchors (AC/HP/speed/proficiency/saves/skills/features) and changed-state hints.
- Ensure save/conflict/dirty state is visible in rails and pulse panel.

Likely files to touch:

- `src/components/character-core/character-sheet-layout.tsx`
- `src/components/character-core/validation-summary.tsx`
- `src/components/character-core/level-up-panel.tsx`
- `messages/en/common.json`, `messages/es/common.json`

Candidate tests:

- Existing mobile smoke + add desktop shell behavior test(s)
- New: step-badge derivation/selectors tests in `src/client/state/__tests__/character-core-workflow.selectors.test.ts`

Suggested commit boundaries:

2. `feat(character-core): add step rail state and completion/warning badges`
3. `feat(character-core): introduce sticky action rail and pulse panel trust signals`

Merge safety: **Yes, in slices** if action handlers continue to call existing endpoints.

---

### Wave 3 — Build/Story mode + selections drawer + progressive disclosure

**Goal:** Reduce form fatigue and support DMV-inspired workbench rhythm.

- Add `Build | Story` mode switch with explicit section visibility rules.
- Add selections drawer/timeline (recent picks + pending choices).
- Add `Show Info` / `Show Selections` controls and drawer/flyout behavior.
- Keep save/conflict indicators permanently visible in both modes.

Likely files to touch:

- `src/components/character-core/character-sheet-layout.tsx`
- `src/components/character-core/character-builder-step-one.tsx`
- `src/client/state/character-core-workflow.selectors.ts`
- New drawer/info components under `src/components/character-core/`

Candidate tests:

- New: mode switch + visibility tests
- New: selections drawer behavior tests
- Update mobile smoke to include mode switching and overflow actions

Suggested commit boundaries:

4. `feat(character-core): add build-story mode split with persistent trust indicators`
5. `feat(character-core): add selections drawer and progressive disclosure controls`

Merge safety: **Mostly yes**; keep default mode behavior backward-compatible.

---

### Wave 4 — Trust-model deepening (conflict/offline/a11y/mobile)

**Goal:** Strengthen reliability and accessibility before visual polish.

- Add field-level validation jump behavior (summary -> first invalid field).
- Expand conflict review to field/row-level diffs while preserving existing 3-choice modal.
- Harden offline restore messaging in shell-level status surfaces.
- Complete mobile parity checks for step rail segmentation + pulse bottom sheet.

Likely files to touch:

- `src/components/character-core/conflict-resolution-dialog.tsx`
- `src/components/character-core/validation-summary.tsx`
- `src/client/state/draft-store.ts`
- `src/client/state/draft-store.storage.ts`

Candidate tests:

- `src/client/state/__tests__/draft-store.character-core-conflict.test.ts`
- New conflict diff behavior test(s)
- Playwright conflict flow and offline restore manual-assisted checks

Suggested commit boundaries:

6. `feat(character-core): add field-level conflict and validation navigation safeguards`
7. `fix(character-core): harden mobile/offline trust surfaces and announcements`

Merge safety: **Conditional**; keep existing conflict modal actions unchanged while adding depth.

---

### Wave 5 — Catalog/auth boundaries + deferred quality items

**Goal:** Close known issues without stalling shell delivery.

- Normalize not-found error code semantics where feasible without contract breakage.
- Keep catalog-driven behavior explicit in option surfaces (no hardcoded class/race assumptions).
- Integrate analytics event hooks when pipeline exists (remove placeholder behavior).
- Plan PDF renderer replacement behind stable export endpoint contract.

Likely files to touch:

- `src/app/api/characters/[id]/route.ts` and sibling routes
- `src/server/application/errors/character-core-errors.ts`
- `src/server/domain/character-core/*`
- `temp/` evidence docs and `docs/specs/character-core/*` status notes

Candidate tests:

- Route tests under `src/app/api/characters/**/__tests__/`
- Use-case tests in `src/server/application/use-cases/__tests__/`

Suggested commit boundaries:

8. `chore(character-core): align not-found/error contract handling across routes`
9. `chore(character-core): wire analytics hook and document deferred pdf renderer boundary`

Merge safety: **Yes**, if API shape remains backward-compatible.

## Dependencies and Sequencing Constraints

1. Wave 1 must land before Waves 2–4 (shared shell is the base).
2. Wave 2 step/action/pulse signals should land before Story mode and selections drawer to avoid duplicated state logic.
3. Wave 4 conflict diff deepening depends on existing conflict metadata contract (`changedSections`) remaining stable.
4. Wave 5 analytics integration depends on platform availability (external to Character Core).
5. Catalog-driven option-card enhancements must preserve existing authn/authz guard order and owner scoping in use-cases.

## Parallelization Plan (max 2 safe streams)

### Stream A (Workbench UX shell)

- Wave 1 + Wave 2 UI composition and interaction contracts.
- Primary files: app route pages, sheet layout, shell/pulse/action/step components, i18n copy.

### Stream B (Trust + contracts)

- Wave 4 + selective Wave 5 contract/test hardening.
- Primary files: conflict dialog, draft store selectors, route/use-case error handling tests.

Parallel safety notes:

- Shared conflict points: `character-sheet-layout.tsx` and translation keys.
- Use branch-level integration checkpoints after each stream’s first commit.

## Verification Matrix

### Automated checks

- `bun run lint`
- `bun test src/components/character-core/__tests__/character-sheet-layout.level-sync.test.ts`
- `bun test src/client/state/__tests__/draft-store.character-core-conflict.test.ts`
- `bun test src/client/state/__tests__/character-core-workflow.selectors.test.ts`
- `bun test src/app/api/characters/__tests__/route.test.ts src/app/api/characters/[id]/__tests__/route.test.ts`
- `bun test src/app/api/characters/[id]/level/__tests__/plan-finalize.route.test.ts`

### Manual checks

- Create flow: Step 1 -> save -> redirected sheet -> draft clean + revision set.
- Save regression guard: repeated save after edits does not regress revision/baseRevision behavior.
- Level regression guard: finalize progression updates class/level used by next save payload.
- Mobile: segmented step rail + sticky bottom actions + pulse panel expand/collapse reachable.
- Accessibility: keyboard navigation across rails/canvas/modals and focus return on modal close.

### Playwright flows (target)

1. Authenticated create-first-save smoke (desktop).
2. Authenticated edit/save/conflict flow with explicit `Review Differences` default focus.
3. Mobile viewport create/edit/save quick flow with bottom action bar.
4. Share toggle + public read route validation (read-only).
5. Export action with unsaved edits choice (`save then export` vs `export last saved`).

## Regression Guardrails (Do Not Reintroduce)

- Guardrail A: create/save reliability path must keep draft/baseRevision sync after success.
- Guardrail B: level finalize must synchronize progression state consumed by subsequent save payloads.
- Guardrail C: conflict modal must always present exactly three explicit actions and preserve local draft safety.
- Guardrail D: warning acknowledgment gating must remain per-warning-code explicit behavior.

## Risk Register + Rollback / Backout Strategy

| Risk | Impact | Mitigation | Backout |
| --- | --- | --- | --- |
| Shell refactor introduces save regressions | High | Keep existing save handlers unchanged in Wave 1; add regression tests first | Revert shell composition commit only; keep domain/use-case commits |
| Mobile parity changes reduce usability | Medium | Ship mobile shell in incremental toggles; run focused mobile smoke per wave | Revert mobile-specific layout commit(s) |
| Conflict diff deepening confuses destructive actions | High | Keep default focus on `Review Differences`; require confirmation for destructive choices | Disable deep diff panel while preserving existing 3-choice modal |
| i18n key drift during rail/mode additions | Medium | Add key coverage checks in tests and keep copy object typing strict | Revert copy-surface commit; fallback to prior keys |
| Contract tweaks on not-found handling break clients | Medium | Keep status stable; migrate code semantics in tested route slices only | Revert route-level error-mapping commit |

## Definition of Done (Aligned to Feature + Foundation + UX)

- [ ] Shared Character Workbench shell is used by create and edit routes.
- [ ] Step rail, action rail, pulse panel, Build/Story mode, and selections drawer meet UX guide contract (desktop + mobile).
- [ ] Save/conflict/offline trust indicators are always visible and behaviorally consistent.
- [ ] Conflict flow supports section-level and field/row-level review while preserving existing explicit three-path choice model.
- [ ] Catalog-driven behavior and auth ownership boundaries remain unchanged and covered by tests.
- [ ] Create/save and level-sync regression guardrails are enforced by automated tests.
- [ ] Verification matrix passes (automated checks + manual + Playwright target flows).
- [ ] Character Core docs remain synchronized (`feature`, `foundation`, `ux-guide`, `implementation-plan`, and this v2 update plan).
