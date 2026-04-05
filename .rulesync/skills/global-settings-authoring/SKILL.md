---
name: global-settings-authoring
description: >-
  Add or extend user-level settings safely through the centralized Global
  Settings model, API, and modal information architecture.
targets: ["*"]
codexcli:
  short-description: Global Settings extension workflow for user-level preferences
---

# Global Settings Authoring Skill

Use this skill when introducing or changing settings that should persist at user level.

## Required Inputs

Before implementation, read:

- `docs/features/global-settings.md`
- `docs/specs/global-settings/foundation.md`
- `docs/architecture/global-state-management.md`

## Extension Workflow

1. **Scope check**
   - confirm the setting is user-level and app-wide
   - reject character/world/game/session-scoped settings for this surface
2. **Section placement**
   - choose an existing settings section when possible
   - add a new section only when IA clarity requires it
3. **Contract updates**
   - define typed setting value shape and allowed options
   - define defaults and invalid-value fallback
4. **Consumer API updates**
   - expose reads via selector-based hook APIs
   - expose writes via typed actions
   - keep a unified settings API even if persistence is delegated by setting type internally
5. **Persistence and feedback**
   - keep auto-apply + immediate persistence behavior
   - ensure visible non-blocking save feedback for success/failure
6. **i18n + accessibility**
   - add translatable labels/help text
   - ensure keyboard support and non-color-only cues

## Guardrails

- no direct localStorage reads/writes in consuming UI components
- no untyped setting keys
- no global settings controls scattered across unrelated routes
- no custom theme-authoring controls in this phase

## Output Contract For Agents

When returning changes, include:

1. setting scope decision and section placement
2. consumer API additions/changes
3. persistence + fallback behavior
4. verification run and remaining gaps
