# UX Guide: <name>

## Metadata

- Status: `proposed` | `in-progress` | `blocked` | `approved` | `superseded`
- Created At: `YYYY-MM-DD`
- Last Updated: `YYYY-MM-DD`
- Owner: `<name or team>`

## Changelog

- Order entries from most recent to oldest.
- `YYYY-MM-DD` - `<author>` - <most recent change and why>
- `YYYY-MM-DD` - `<author>` - <older change and why>

## Related Feature and Spec

- Feature: `docs/features/<feature-name>.md`
- Foundation spec: `docs/specs/<feature-name>/foundation.md` (or equivalent)
- Add any supporting architecture notes that shape UX constraints.

## Context

- Explain what user problem this UX guide is reducing.
- Call out where users are likely to get stuck (rules friction, dense forms, mobile constraints, etc.).
- Keep this grounded in table use and real editing behavior, not idealized flows.

## UX Goals and Success Signals

### UX Goals

1. <goal tied to user outcome>
2. <goal tied to speed/clarity/trust>
3. <goal tied to resilience/accessibility>

### Success Signals

- <observable signal: completion rate, time to task, reduced error loops, etc.>
- <observable signal>
- <observable signal>

## Information Architecture (IA)

### IA Principles

- <what must stay visible>
- <what can be collapsed or progressive>
- <how navigation should reduce cognitive load>

### IA Layout

- Primary zones: <summary strip, main editor, validation panel, etc.>
- Secondary actions: <share/export/history/advanced controls>
- Guidance area: <where next action/help text lives>

## Key User Journeys

### 1) <journey name>

- Start: <entry point>
- Critical path: <key steps>
- Exit/Success: <what confirms completion>

### 2) <journey name>

- Start: <entry point>
- Critical path: <key steps>
- Exit/Success: <what confirms completion>

### 3) <journey name>

- Start: <entry point>
- Critical path: <key steps>
- Exit/Success: <what confirms completion>

## Validation and Override Behavior

- Define severity levels (`hard` blocking vs `soft` overridable).
- Specify exactly when save/continue is blocked.
- Require explicit acknowledgment per warning code (no blanket silent ignore).
- Define reset behavior when warning context changes.
- Define UX copy expectations: clear mismatch reason + likely consequence.

## Responsive and Mobile Expectations

- Mobile-first baseline: <single-column or staged disclosure expectations>
- Critical controls remain reachable without precise scrolling.
- No required hover-only behavior.
- Minimum tap target: `44x44` CSS px for actionable controls.
- Define how dense tables/lists adapt on narrow viewports.

## Offline Draft and Conflict Behavior

- Unsaved edits: <dirty state indicator + local draft contract>
- Reopen behavior: <restore prompt and fallback when restore fails>
- Conflict behavior: <modal/drawer + required choices>
- Non-destructive default action must be explicit.
- Never discard local draft silently.

## Accessibility Expectations

### Keyboard and Focus

- <all core flows keyboard-completable>
- <focus management on errors/modals>

### Screen Reader Semantics

- <label/description/error associations>
- <validation summary announcement and linking>
- <live region announcements for save/restore/conflict events>

### Motion and Sensory Safety

- Respect `prefers-reduced-motion` and app-level motion settings.
- Avoid decorative motion that obscures state or shifts layout unexpectedly.

## Design-System Alignment

- Use Arcane Codex semantic tokens only (no ad hoc color literals).
- Reuse existing `ui/*` primitives and route-surface patterns.
- Keep critical state label-first; icon-only is allowed only for secondary controls with accessible names.
- Keep workbench surfaces dense but legible; prioritize clarity over ornament.

## UX States Checklist (Implementation + QA)

| State | Required UX Behavior |
| --- | --- |
| Loading | <skeleton/staged placeholder keeps structure understandable> |
| Empty | <explains missing data and provides immediate next step> |
| Error (recoverable) | <clear issue + retry/fallback action> |
| Error (blocking validation) | <inline errors + global summary + focus guidance> |
| Success | <clear confirmation + next action> |
| Dirty/Unsaved | <persistent unsaved indicator + save affordance> |
| Offline | <offline signal + local draft reassurance> |
| Stale/Conflict | <explicit choice workflow; non-destructive default> |
| Restored Draft | <restore confirmation + discard option> |

## Acceptance Criteria

1. <users complete core journey without dead-end states>
2. <validation and override behavior is consistent across relevant surfaces>
3. <mobile users can complete core tasks without desktop-only affordances>
4. <offline/conflict behavior prevents silent data loss>
5. <keyboard and screen reader users can complete primary flows>
6. <implementation follows Arcane Codex token/component contract>

## Open Questions

1. <unresolved UX decision>
2. <unresolved policy/interaction tradeoff>
3. <unresolved mobile/accessibility edge case>

## Related Docs

- `docs/features/<feature-name>.md`
- `docs/specs/<feature-name>/foundation.md`
- `docs/specs/<feature-name>/implementation-plan.md`
- `docs/specs/design-system/foundation.md`
- `docs/architecture/<related-note>.md`
