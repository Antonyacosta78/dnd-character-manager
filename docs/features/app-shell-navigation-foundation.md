# Feature Rundown: App Shell Navigation Foundation (Global Chrome IA)

## Metadata

- Status: `implemented`
- Created At: `2026-04-05`
- Last Updated: `2026-04-05`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-05` - `Antony Acosta` - Implemented baseline `9A` shared shell navigation with locked IA/routes, desktop/mobile submenu behavior, utility/account split, tooltip/i18n wiring, and migration away from the temporary floating settings trigger.
- `2026-04-05` - `Antony Acosta` - Resolved interaction defaults for locked destinations, desktop/mobile submenu behavior, and touch tooltip strategy; narrowed account menu MVP to sign-out only.
- `2026-04-05` - `Antony Acosta` - Specified MVP tooltip copy per nav destination and utility item so navigation reinforcement language is concrete and implementation-ready.
- `2026-04-05` - `Antony Acosta` - Refined v1 destination map naming to use `Adventures` as the umbrella for campaigns/one-shots and added tooltip expectations for every nav item, including explanatory copy for `Adventures`. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Linked scoped implementation follow-up in `src/components/patterns/surface-shell.tsx` so Global Settings moves from temporary floating trigger to the shared navbar utility area as part of this feature. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Resolved MVP open questions: account menu scope is profile/sign-out only and permission-limited destinations stay visible with locked treatment. Aligned scope references to Roadmap Phase 8 naming and linked settings utility behavior to the shipped Global Settings surface. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Added a dedicated global app-shell navigation feature rundown to separate chrome IA scope from Phase 7 roster discovery work. (Made with OpenCode)

## Summary

Establish a clear global app shell so players and DMs can move across core product surfaces without friction in both one-shots and long-running campaigns.

This feature locks the Arcane Codex shell pattern (`9A`: left rail + top utility bar) and defines first-version destination hierarchy: `Characters`, `Worlds`, and `Adventures` as primary navigation with contextual submenus for `Branches` and `Sessions`. `Settings` remains a distinct bottom utility action and username/account actions remain in the top utility zone. MVP focuses on reliable wayfinding and accessibility, not advanced roster discovery.

## Boundary With Phase 8 (Roster And Navigation)

This feature is intentionally not Phase 8. It defines global chrome information architecture only.

In scope here (global shell IA):

- persistent primary destinations in shell chrome
- utility action placement and behavior
- desktop/mobile shell behavior and navigation affordances
- accessibility and state handling for shell navigation patterns

Out of scope here (Phase 8 roster discovery):

- character search
- filter systems (class, level, world, tags, and similar facets)
- recent-use ranking or most-played logic
- grouping and discovery behavior inside roster views

## Must Have

- Preserve Arcane Codex shell baseline `9A`: left rail plus top utility bar.
- Keep a workbench-first, restrained chrome suitable for dense interactive use.
- Use token-driven styling only; preserve compact density, near-square controls, and minimal ornament defaults.
- Expose first-class labeled primary rail destinations for `Characters`, `Worlds`, and `Adventures`.
- Provide nested submenu access for:
  - `Branches` under `Characters`
  - `Sessions` under `Adventures`
- Keep `Settings` and username/account actions in the top utility zone.
- `Settings` uses the existing Global Settings surface (`docs/features/global-settings.md`) and remains separate from account-menu actions.
- Replace the temporary floating Global Settings trigger in `src/components/patterns/surface-shell.tsx` with the shared navbar utility action in this feature slice.
- Show tooltips for every nav item to reinforce destination meaning and improve scan confidence.
- Include explanatory tooltip copy for `Adventures` that clarifies it includes campaigns, one-shots, and similar play tracks.
- Keep primary location navigation separate from utility/account actions.
- Support responsive behavior:
  - desktop: persistent labeled rail plus stable top utility zone
  - mobile: rail transforms to drawer/sheet with shallow access to primary and utility actions
  - desktop submenu default: collapsed, user-expandable, and preference is remembered
  - mobile submenu pattern: drill-in panels with explicit back navigation
- Represent shell-relevant states explicitly where applicable: loading, empty, permission-limited, and recoverable error.
- Permission-limited destinations remain visible as locked entries with clear reason text and guidance.
- Ensure accessibility behaviors:
  - keyboard navigation and visible focus states
  - landmark and menu semantics
  - `Esc` closes open drawer/menu overlays
  - reduced-motion behavior for shell transitions
  - active route indication uses multiple cues, not color alone
  - safe truncation for long labels without breaking orientation

## Tooltip Copy (MVP)

- `Characters`: "View and manage your character roster."
- `Branches` (submenu): "Open alternate builds and timeline branches for a character."
- `Worlds`: "Manage shared world continuity and context."
- `Adventures`: "Browse all your campaigns, one-shots, and short arcs."
- `Sessions` (submenu): "View sessions for each adventure and prepare playable versions."
- `Settings` (bottom utility): "Open global app preferences such as theme and language."
- `Account` (username menu): "Sign out of this account."

Touch behavior note:

- On touch devices, do not require long-press tooltip behavior; rely on visible labels and helper text for locked/ambiguous items.

## Nice to Have

- Utility-zone placeholder for future lightweight global actions without expanding MVP IA complexity.
- Optional restore of last-visited primary destination on re-entry.
- Lightweight helper copy for empty or permission-limited nav destinations.

## Non-Functional Requirements

- Accessibility: practical WCAG AA baseline for keyboard, focus, semantics, and non-color-only cues.
- Performance: shell transitions avoid large animated layout shifts and remain stable on dense screens.
- Responsiveness: navigation remains usable and shallow on mobile without nested-menu overload.
- Consistency: shell treatment remains aligned with Arcane Codex tokens and density conventions.
- Maintainability: IA stays simple and explicit so future destinations can be added without restructuring shell foundations.
- Localization: nav labels and tooltips are localizable and do not hardcode English-only copy.

## Acceptance Criteria

- App shell uses the selected `9A` baseline (left rail + top utility bar) across authenticated core routes.
- Primary rail presents labeled first-class destinations for `Characters`, `Worlds`, and `Adventures`.
- Submenu destinations are present as `Branches` under `Characters` and `Sessions` under `Adventures`.
- Top utility zone contains `Settings` and username/account actions.
- Account menu MVP scope is sign-out only; profile/account-preference surfaces remain outside this menu for now.
- `src/components/patterns/surface-shell.tsx` no longer uses a temporary floating settings trigger because settings access is provided by the shared navbar utility area.
- Every nav item exposes a tooltip and `Adventures` tooltip explicitly explains coverage of campaigns and one-shots.
- Tooltips match the MVP destination copy defined in this rundown and remain localizable.
- On touch devices, navigation does not depend on long-press tooltips.
- Core destinations are never hidden behind icon-only or account-menu-only navigation patterns.
- Desktop and mobile shell behaviors are both present, with mobile drawer/sheet access that stays shallow and clear.
- Desktop submenus default to collapsed and persist user-expanded state.
- Mobile submenus use drill-in navigation panels with clear back behavior.
- Active route state is visible through multiple signals, not color alone.
- Keyboard and focus interactions work for rail, drawer/sheet, and account/menu surfaces; `Esc` dismisses open overlays.
- Shell interactions respect reduced-motion expectations and avoid disruptive layout shifts.
- Loading, empty, permission-limited, and recoverable-error states are explicitly represented for shell-relevant contexts.
- No Phase 8 roster discovery behavior (search/filter/recents/grouping logic) is introduced in this feature slice.

## Open Questions

- None at this time for MVP scope.

## Resolved Decisions

- Account menu MVP scope is limited to profile/sign-out essentials; account-preference controls remain under the separate `Settings` utility entry.
- Permission-limited destinations remain visible in global navigation with locked/disabled treatment and helper context.
- `Adventures` is the v1 umbrella destination label for campaigns and one-shots.
- Tooltips are required for every navigation item in this feature slice.
- Desktop submenus default to collapsed and remember each user's expansion preference.
- Mobile submenus use drill-in panels instead of in-drawer accordions.
- Touch devices use labels/helper text; tooltip behavior does not depend on long-press interactions.
- Account menu MVP is sign-out only; profile management is deferred to settings/account surfaces later.

## Related Specs

- `docs/specs/design-system/visual-baseline-v1.md`
- `docs/specs/navigation/app-shell-navigation-foundation.md` (to be created)
- `docs/specs/navigation/app-shell-navigation-content-model.md` (to be created)
- `docs/specs/navigation/app-shell-navigation-accessibility-checklist.md` (to be created)

## Related Architecture

- `docs/architecture/app-architecture.md`
- `docs/architecture/global-state-management.md`
- `docs/architecture/design-system-decision-record.md`
- `docs/architecture/navigation-shell-state-and-routing.md` (to be created)

## Document Health

- Keep this rundown aligned with `docs/ROADMAP.md` and `docs/STATUS.md` as scope evolves.
- If this feature status moves to `blocked`, record blocker and owner in `Open Questions`.
