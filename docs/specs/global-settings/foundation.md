# Spec: Global Settings Foundation (MVP)

## Metadata

- Status: `approved`
- Created At: `2026-04-05`
- Last Updated: `2026-04-05`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-05` - `Antony Acosta` - Synced spec to shipped behavior: per-control feedback overlays, eased `900ms` save-feedback cycle, reduced-motion fallback semantics, and hook stability guidance to prevent snapshot identity update loops. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Extended MVP theme contract with an experimental border-radius setting (`none` to `pronounced`) and updated types, validation, persistence/fallback, and verification expectations while preserving the unified API + i18n ownership split model. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Locked implementation-level decisions for persistence ownership split, save-feedback animation behavior, app-shell trigger placement, and verification matrix expectations. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Added extension governance and consumer API contract so future user-level settings can be added through typed hooks/selectors without fragmenting settings ownership. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Created the implementation-ready MVP contract for Global Settings (theme + language), including persistence, validation, accessibility, and integration boundaries. (Made with OpenCode)

## Related Feature

- `docs/features/global-settings.md`

## Context

- Phase 2 in `docs/ROADMAP.md` defines Global Settings as a small, centralized, user-level configuration foundation.
- `docs/STATUS.md` marks this phase as completed with implementation evidence; this spec now serves as the approved behavior contract for maintenance and extension.
- The design-system foundation is already wired, with default visual baseline (`2D` + `bookish`) and validated theme variants demonstrated in `src/app/ui/sandbox/sandbox-theme-shell.tsx`.
- i18n foundation is already wired with supported locales (`en`, `es`), cookie/localStorage convergence, and fallback semantics.

This spec keeps scope intentionally narrow: one stable Global Settings modal, one stable settings model boundary, and only two MVP preferences (theme and language).

## Current Plan

### Scope for this spec

- Add a dedicated Global Settings modal reachable from primary app navigation.
- Modal trigger location: small cog icon at the end of the primary navigation bar.
- Use a two-pane information architecture:
  - left rail: settings sections
  - right panel: active section controls
- Ship only user-level preferences in MVP:
  - theme: palette + font stack + experimental border radius
  - language: app locale
- Define a settings consumer API for future component access:
  - selector-based settings reads
  - action-based settings writes
- Use auto-apply behavior with immediate persistence and visible save-completion feedback.

### Out of scope (explicitly deferred)

- Character/world/game/branch-level overrides.
- Custom theme authoring, token editing, or arbitrary user theme uploads.
- Account/cloud sync of preferences.
- Expanding to broad settings categories beyond what is required for MVP stability.

### Feature contract

1. **Settings ownership contract**
   - Global Settings owns only app-level user preferences that should apply consistently across routes.
   - No gameplay/session state or domain entities are read or mutated by this feature.

2. **Theme options contract (locked for MVP)**
   - Palette options: `2A`, `2B`, `2C`, `2D`, `2E`.
   - Font stack options: `baseline`, `serifUi`, `bookish`, `times`.
   - Border-radius options (experimental/tunable): `none`, `subtle`, `moderate`, `pronounced`.
   - Default selection when no valid persisted preference exists: `2D` + `bookish` + `moderate` radius.

3. **Language options contract (MVP)**
   - Language control exposes currently supported locales only: `en`, `es`.
   - Unsupported/invalid stored locale values are ignored and replaced via existing i18n fallback rules.

4. **Apply + persistence contract**
   - Preference changes apply immediately after user interaction (no explicit Save button required).
   - Preference writes happen immediately after apply (best effort, deterministic ordering).
   - On successful write, UI must show non-blocking completion feedback.
   - Save completion feedback pattern: inline overlay on the edited control using success-state token color + status copy (for example `Setting saved`), with eased fade-in/fade-out cycle around `900ms`.
   - Overlay must scope to the edited input control, not the entire settings section container.

5. **Persistence ownership split contract**
   - Global Settings provides one unified consumer API for reads/writes.
   - Theme persistence is owned by Global Settings modules.
   - Locale persistence is delegated through existing i18n persistence/resolution path.
   - Consuming components never choose persistence owner directly.

6. **Failure contract**
   - If persistence fails, app keeps the in-memory applied state for current session when possible.
   - UI shows a recoverable warning with clear fallback guidance.
   - On next load, app falls back to last valid persisted values or defaults.

7. **Hydration contract**
   - Persisted values are validated before application.
   - Initial application runs early enough to avoid obvious visual flicker/mismatch.
   - Invalid payloads fail closed for value application (never apply unknown theme/locale codes).

8. **Extension contract (future user-level settings)**
   - New settings must be user-level and app-wide to be added here.
   - New settings must declare typed value shape, defaults, invalid-value fallback, and persistence semantics.
   - New settings should extend existing section groups first; create new sections only when information architecture clarity requires it.
   - New settings must be exposed through centralized selectors/actions; no direct localStorage reads/writes in consuming components.

### Tradeoff stance

- Keep one centralized UI surface now, even if persistence internals are split (theme preference storage vs existing i18n locale persistence). This avoids risky rewrites to already-working i18n behavior.
- Prefer deterministic behavior over speculative extensibility (no plugin-like settings registry in MVP).

## Data and Flow

Inputs:

- User interaction events from Global Settings controls.
- Persisted theme preference payload from client storage (untrusted).
- Locale preference from existing i18n sources (cookie/localStorage, untrusted).
- Supported option registries (trusted):
  - theme palettes/fonts/radius presets listed in this spec
  - locales from `src/i18n/locales.ts`

Transformation path:

1. User opens Global Settings modal.
2. Modal view model composes current effective preferences (theme + locale).
3. User changes a control.
4. Selected value is validated against supported options.
5. If valid, preference is applied immediately.
6. Persistence write is attempted immediately.
7. UI surfaces save outcome:
   - success: non-blocking completion feedback
   - failure: recoverable warning + fallback guidance

Trust boundaries:

- **Untrusted**: stored values from localStorage/cookie, raw UI event payloads.
- **Validated**: parsed preference values after supported-option checks.
- **Trusted internal**: typed preference model used by app rendering.

Outputs:

- App-wide effective theme selection.
- App-wide effective locale selection.
- Visible save status feedback tied to user action outcome.

## Constraints and Edge Cases

- **Unknown theme codes in storage**
  - Ignore invalid palette/font/radius values and fall back to defaults.
- **Partial persisted theme payload**
  - If one field is invalid/missing, recover valid fields and default only the invalid/missing field.
- **Storage unavailable (private mode/quota/security policy)**
  - Keep session behavior usable; show recoverable warning; do not crash modal.
- **Rapid sequential preference changes**
  - Latest selection wins; save feedback corresponds to latest acknowledged write outcome.
- **Selector/action snapshot churn**
  - Action consumer APIs must keep stable snapshot identity to avoid render loops (`getSnapshot` cache warnings / maximum update depth errors).
- **Cross-tab mismatch**
  - Explicitly out of scope for MVP; no real-time sync guarantee.
- **Locale mismatch at hydration**
  - Follow existing i18n convergence behavior; Global Settings UI reflects resolved effective locale after convergence.
- **Modal close during pending write**
  - Write operation can complete in background; next modal open reflects final persisted state.

## Error Handling

Error categories for this feature layer:

- `settings_theme_invalid_payload`
  - Invalid persisted theme payload; discard invalid palette/font/radius values and fallback safely.
- `settings_theme_persistence_unavailable`
  - Theme write failure due to unavailable storage/quota/security.
- `settings_theme_radius_invalid_value`
  - Unsupported radius value from UI/storage input; reject value and keep/apply safe fallback.
- `settings_locale_update_failed`
  - Locale preference update could not complete through i18n persistence path.

Handling rules:

- Translate low-level storage/i18n errors into user-safe messages at settings feature boundary.
- Do not expose raw exception text to users.
- Diagnostics may include error category + machine-readable context only (no user free text).

## Types and Interfaces

```ts
export type ThemePaletteCode = "2A" | "2B" | "2C" | "2D" | "2E";

export type ThemeFontCode = "baseline" | "serifUi" | "bookish" | "times";

export type ThemeRadiusCode = "none" | "subtle" | "moderate" | "pronounced";

export interface ThemePreference {
  palette: ThemePaletteCode;
  font: ThemeFontCode;
  radius: ThemeRadiusCode;
}

export interface GlobalSettingsState {
  theme: ThemePreference;
  language: SupportedLocale;
}

export interface GlobalSettingsActions {
  setThemePalette(palette: ThemePaletteCode): void;
  setThemeFont(font: ThemeFontCode): void;
  setThemeRadius(radius: ThemeRadiusCode): void;
  setLanguage(locale: SupportedLocale): void;
  resetToDefaults(): void;
}

export type SettingSectionKey = "appearance" | "language";

export type SaveFeedbackState = "idle" | "saving" | "saved" | "error";

export type GlobalSettingsSelector<TSelected> = (
  state: GlobalSettingsState & { saveFeedback: SaveFeedbackState },
) => TSelected;
```

Interface ownership:

- Feature-level settings contracts should live under a dedicated global-settings module path when implementation starts.
- Locale type source of truth remains `SupportedLocale` from `src/i18n/locales.ts`.
- Consumer API should expose selector-driven hook reads and action APIs (for example `useGlobalSettings(selector)` and `useGlobalSettingsActions()`).

## Integration Points

- **Design system**
  - Reuse Arcane Codex tokens and approved option sets from design-system foundation and sandbox baseline.
  - Do not bypass token-driven styling through ad-hoc color/font literals.
- **i18n**
  - Reuse locale persistence/resolution contracts from existing i18n foundation (`cookie + localStorage + fallback`).
  - Global Settings language control is the user-facing mutation surface for that existing contract.
- **Global client state**
  - Keep settings state separate from domain draft-state concerns; no domain entity ownership transfer.
  - Consumers read/write settings through centralized hooks/selectors/actions; avoid ad-hoc storage access in UI components.
- **App shell/layout**
  - Global Settings is opened from a cog icon control at the end of primary navigation.
  - Theme/locale application must be compatible with root layout hydration behavior.

## Behavior Expectations

- Global Settings is easy to discover from primary navigation.
- Opening the modal always shows current effective preferences.
- Selecting a new theme updates visible app styling immediately.
- Selecting a new radius option updates app-wide corner radius styling immediately within approved presets.
- Selecting a new language updates app locale behavior consistently through the existing i18n path.
- Save completion feedback appears after each successful change.
- Save failure feedback is clear, non-blocking, and actionable.
- Reset behavior (if shipped in MVP) resets to defaults (`2D`, `bookish`, `moderate`, `en`) and persists immediately.
- Adding future user-level settings follows the same contract: typed option validation, immediate apply, immediate persistence, and explicit save feedback.

## Verification Expectations

Automated checks:

- `bun run lint`
- `bun run i18n:check-catalog`

Manual behavior scenarios:

- Open Global Settings from nav cog trigger and verify modal semantics.
- Change theme palette, font, and radius; verify immediate visual application and persisted restoration after reload.
- Change language; verify locale update consistency with existing i18n behavior and persistence.
- Verify inline save feedback overlay appears on changed control only and runs eased fade cycle around `900ms`.
- Force persistence failure path (for example storage unavailable) and verify recoverable warning behavior.

Accessibility checks:

- Keyboard-only traversal for modal open, section switching, control edits, and close.
- Escape key closes modal and focus returns to trigger.
- Save feedback is announced by assistive tech (polite live region or equivalent).
- Feedback and option state meaning are understandable without color perception.
- Reduced-motion preference disables non-essential motion in modal and feedback transitions.

## Accessibility Expectations

- Modal must have proper dialog semantics (`role="dialog"`, labelled title, focus trap, escape to close).
- Section rail is keyboard navigable with clear active-state indication.
- Every control has explicit text labels and associated form semantics.
- Save-status feedback is announced accessibly (for example through a polite live region).
- Theme option communication cannot rely on color alone; include text labels/codes.
- Focus states must remain visible across all supported palettes/fonts.
- Reduced-motion preferences must be respected for modal and feedback transitions.

## Open Questions

- None for MVP scope.

## Resolved Decisions

- Global Settings is the centralized place for user-level app options.
- MVP includes theme and language preferences only.
- Settings UI uses a two-pane modal (left section rail + right content panel).
- Initial theme options include all currently available variants from `ui/sandbox`.
- MVP theme controls include an experimental border-radius preset range from `none` to `pronounced` (`none`, `subtle`, `moderate`, `pronounced`).
- Behavior is auto-apply with immediate persistence and visible save-completion feedback.
- Save feedback uses inline control overlay with eased `900ms` cycle timing and reduced-motion fallback.
- Persistence ownership is split internally (theme via Global Settings modules, locale via i18n path) behind one unified settings consumer API.
- Global Settings trigger is a cog icon at the end of primary navigation.
- Account-sync is deferred.

## Related Implementation Plan

- `docs/specs/global-settings/implementation-plan.md`
