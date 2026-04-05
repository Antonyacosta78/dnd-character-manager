---
root: false
targets: ["*"]
description: "Govern adding new user-level settings to the centralized Global Settings surface"
globs: ["src/app/**/*", "src/components/**/*", "src/client/**/*", "src/i18n/**/*", "docs/features/global-settings.md", "docs/specs/global-settings/**/*.md"]
opencode:
  description: "Govern adding new user-level settings to the centralized Global Settings surface"
---

# Global Settings Extension

## Scope Gate

- Add a setting to Global Settings only if it is **user-level** and should apply app-wide.
- If a setting belongs to character/branch/world/game/session scope, do not add it to Global Settings.

## Required Additions For New Settings

When adding a new user-level setting, update all of the following:

1. feature/spec docs (`docs/features/global-settings.md`, `docs/specs/global-settings/foundation.md`) when behavior or boundaries change
2. typed setting contract (value shape, allowed options)
3. default value and invalid-value fallback behavior
4. persistence and hydration handling
5. UI save feedback behavior (success and recoverable failure)
6. i18n labels/help text for user-facing controls

## Consumer API Rule

- Settings consumers must read from a centralized selector-based API (for example `useGlobalSettings(selector)`).
- Settings writes must use typed actions (for example `setLanguage`, `setThemePalette`) rather than ad-hoc localStorage writes.
- Do not pass settings deeply through props when selector-based subscription is sufficient.
- Keep one unified settings API even when persistence ownership is split internally (for example locale via i18n persistence path).

## IA and UX Rule

- Keep settings controls centralized in the two-pane Global Settings modal.
- Extend existing sections first; add new sections only when grouping clarity requires it.
- Do not scatter user-level settings controls across unrelated routes as primary control points.

## Prohibited Patterns

- per-character/per-world/per-game overrides inside Global Settings
- direct storage access in arbitrary UI components for settings reads/writes
- untyped setting keys or loosely validated payloads
- adding new settings without defaults/fallback behavior
