# Feature Rundown: Global Settings Foundation

## Metadata

- Status: `completed`
- Created At: `2026-04-05`
- Last Updated: `2026-04-05`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-05` - `Antony Acosta` - Synced rundown with shipped implementation details: per-control save feedback overlays, eased `900ms` feedback timing, and selector/action hook stability constraints from runtime validation. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Added an MVP experimental border-radius theme control contract (`none` through `pronounced`) and aligned acceptance criteria/resolved decisions so implementation includes validation, persistence, and fallback behavior. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Locked implementation-direction decisions for settings ownership split, save-feedback interaction, app-shell trigger placement, and verification expectations so the implementation plan can proceed without ambiguity. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Added extensibility and consumer-API expectations so new user-level settings can be added predictably without changing IA or bypassing centralized state contracts. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Locked initial global-theme option set to all variants currently exposed in `ui/sandbox` and resolved persistence behavior to auto-apply with immediate save feedback. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Refocused scope from a theme-first framing into a centralized user-level settings surface with a two-pane modal IA and section-based navigation. Added rough ASCII wireframe for planning alignment. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Initial Global Settings rundown created to define MVP scope that unlocks Theme Selector without overextending into advanced customization. (Made with OpenCode)

## Summary

Create a small, reliable Global Settings foundation so players can manage all user-level app preferences in one centralized surface.

This feature is primarily a prep-time quality-of-life layer for both players and DMs. Its MVP purpose is to establish settings IA, persistence behavior, and first-party controls for user-level preferences (for example language and theme), so configurable options are not scattered across screens.

## Interface Structure (MVP)

- Use a **two-pane settings modal**:
  - left pane: section navigation (settings categories)
  - right pane: section content with form controls
- Current trigger placement is a small cog icon anchored at top-right of the app shell.
- Navigation follow-up: move trigger into navbar-end placement once roadmap Phase 8 navigation is implemented.
- Keep this as the canonical entry point for user-level app preferences.
- Prefer clear section labels and predictable grouping over deep nested flows.

## Extensibility Contract (Post-MVP Safe Growth)

- New settings are allowed only when scope is truly user-level and app-wide.
- New settings should be added by extending existing section groups first; add a new section only when grouping becomes unclear.
- Each new setting must define:
  - ownership boundary (user-level only)
  - typed value shape and allowed options
  - default value and invalid-value fallback
  - persistence and save-feedback behavior
- Adding settings must not break the two-pane IA or introduce route-scattered preference controls.

## Rough ASCII Wireframe

```txt
+--------------------------------------------------------------------------------------------------+
| Global Settings                                                                            [x]   |
+--------------------------------------------------------------------------------------------------+
|  Search settings...                                                                             |
|  ----------------------------------------------------------------------------------------------  |
|  [Sections / Navigation Rail]         |  [Section Content Panel]                               |
|                                        |                                                        |
|  Appearance                            |  Appearance                                             |
|  Language & Region                     |  Theme                                                  |
|  Accessibility                         |   - Palette: [2A v]                                    |
|  Notifications                         |   - Font:    [Bookish v]                               |
|  Data & Privacy                        |   - Radius (experimental): [Moderate v]                |
|                                        |                                                        |
|                                        |  Language & Region                                     |
|                                        |   - App language: [English v]                          |
|                                        |                                                        |
|                                        |  Accessibility                                         |
|                                        |   - Reduced motion: [System v]                         |
|                                        |                                                        |
|                                        |  ----------------------------------------------------  |
|                                        |  [Reset to defaults]                [Close]            |
+--------------------------------------------------------------------------------------------------+
```

## Must Have

- A dedicated Global Settings modal reachable from primary app navigation.
- A stable settings model for app-wide, user-level preferences (not character-, branch-, world-, or game-specific data).
- Two-pane IA shipped for MVP:
  - left section navigation rail
  - right section content form panel
- Theme controls integrated with current Arcane Codex design-system direction:
  - keep current default visual baseline as initial selection
  - include all options currently available in `ui/sandbox` for initial release
    - palettes: `2A`, `2B`, `2C`, `2D`, `2E`
    - font stacks: `baseline`, `serifUi`, `bookish`, `times`
    - border radius (experimental): `none`, `subtle`, `moderate`, `pronounced`
  - treat border-radius as an experimental/tunable MVP control with preset options only (no custom numeric input)
  - allow switching among approved global theme options only
  - apply selected theme consistently across app routes
- Language preference controls included in Global Settings and persisted with the same reliability contract.
- A typed consumer API exists for app-wide settings reads/writes so components can subscribe without prop-drilling.
- Global Settings is the only user-facing write entry point; internal persistence ownership may delegate by setting type (for example locale via i18n adapter).
- Deterministic settings persistence and hydration so preferences survive refresh and browser restart.
- Safe fallback behavior when stored settings are invalid or unavailable.
- Clear separation in copy and IA between:
  - prep/session-independent preferences (Global Settings)
  - in-session or game-state actions (kept out of this feature)

## Nice to Have

- Preview helpers (for example concise labels or swatches) that make theme differences obvious before selection.
- A lightweight reset-to-default control for Global Settings.
- Reserved section stubs for future user-level preferences without shipping broad control sets yet.

## Non-Goals (MVP)

- No per-character, per-branch, per-world, or per-game theme overrides.
- No session-only quick toggles on gameplay screens.
- No custom user-authored themes, token editors, or advanced visual tuning controls.
- No expansion into campaign management preferences.
- No broad settings sprawl beyond the minimum needed to support a reliable centralized settings experience.

## UX Expectations: Prep vs In-Session

- Prep-time expectation:
  - users can open Global Settings before building/playing and set preferences once with confidence.
  - theme change feedback is immediate and visually clear.
- In-session expectation:
  - settings remain available but are not positioned as a high-frequency combat/session tool.
  - any change should be low-friction and non-destructive, without affecting character mechanics or game history.

## Persistence Strategy Expectations

- Preferences persist per user environment and rehydrate automatically on next app load.
- Persistence ownership split is allowed internally when needed:
  - theme persistence is owned by Global Settings modules
  - locale persistence is delegated through existing i18n persistence/resolution contracts
  - all writes still flow through one Global Settings consumer API surface
- Persisted values must be validated against supported options before application.
- If persistence read fails, app falls back to defaults and remains usable.
- Preference application should occur early enough to avoid jarring visual mismatch during app load.
- Global Settings persistence should align with existing global-state and i18n preference patterns where possible.
- Save feedback uses an inline control overlay on the edited input only: success-color fill + "Setting saved" status text with an eased animation cycle around `900ms` (reduced-motion-safe fallback).

## Sequencing Slices

1. **Slice A - Settings modal foundation**
   - establish entry point, two-pane modal layout, and section navigation structure.
2. **Slice B - Core user preferences**
   - ship theme (palette, font, experimental radius) and language as first user-level preferences in the shared settings model.
3. **Slice C - Persistence hardening**
   - enforce validation, fallback, and hydration behavior across refresh/navigation.
4. **Slice D - Extension hooks (no broad expansion)**
   - prepare section-level extension points for future user-level preferences without widening MVP scope.

## Non-Functional Requirements

- Reliability: settings behavior is deterministic across routes and reloads.
- Accessibility: settings controls remain keyboard- and screen-reader-friendly.
- Performance: applying persisted theme does not introduce noticeable UI delay.
- Maintainability: global settings schema stays narrow and explicitly versionable.
- Consistency: theme behavior uses approved design tokens and does not bypass design-system contracts.

## Acceptance Criteria

- Global Settings is discoverable from app navigation and opens a dedicated two-pane modal.
- Global Settings is triggered by a top-right anchored cog icon in the current shell.
- The modal provides section navigation in a left rail and section form content in the main panel.
- Theme and language preferences are available as user-level settings within this modal.
- Theme controls present only supported global options and default safely when no selection exists.
- Border-radius is included under theme settings as an experimental/tunable control with typed values from `none` to `pronounced` (`none`, `subtle`, `moderate`, `pronounced`).
- Selecting a theme updates app-wide presentation consistently across navigable routes.
- Theme changes auto-apply and persist immediately, with visible UI feedback for save completion.
- Save feedback appears as inline overlay status on the changed control (not the entire section) and runs an eased fade-in/fade-out around `900ms`.
- Settings consumers read from a centralized hook/selector API instead of direct storage access.
- Refreshing the app preserves the prior valid selection.
- Invalid persisted values are ignored and replaced by a safe default without breaking UI.
- Global Settings does not introduce any character/game data mutation.
- Scope guardrails hold: no per-world/per-character theming and no custom theme authoring in MVP.

## Resolved Decisions

- Initial theme set for first release includes all options currently available in `ui/sandbox`.
- MVP theme controls include an experimental border-radius option constrained to typed presets (`none`, `subtle`, `moderate`, `pronounced`) with safe default fallback.
- Preference changes use auto-apply with immediate persistence.
- Settings UI must provide clear non-blocking completion feedback when preference save succeeds (and explicit fallback guidance if save fails).
- Settings growth path remains centralized: extend sections and typed settings contracts over time; do not scatter user-level controls across unrelated routes.
- Settings ownership uses one unified Global Settings consumer API, with internal persistence delegation allowed (locale via i18n path, theme via Global Settings modules).
- Modal trigger is currently top-right anchored and should move into navbar-end placement in roadmap Phase 8.
- Global settings feedback animation uses per-control overlays with eased `900ms` cycle timing and reduced-motion fallback.
- Settings action consumers must use stable selector/action hook usage so snapshot identity does not trigger render loops.

## Related Specs

- `docs/specs/global-settings/foundation.md`
- `docs/specs/design-system/foundation.md`
- `docs/specs/design-system/visual-baseline-v1.md`
- `docs/specs/design-system/implementation-plan.md`
- `docs/specs/internationalization/foundation.md`
- `docs/specs/internationalization/implementation-plan.md`

## Related Architecture

- `docs/architecture/design-system-decision-record.md`
- `docs/architecture/global-state-management.md`
- `docs/architecture/internationalization.md`
