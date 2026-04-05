# Feature Rundown: Character Core

## Metadata

- Status: `proposed`
- Created At: `2026-04-05`
- Last Updated: `2026-04-05`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-05` - `Antony Acosta` - Created the initial Character Core rundown with finalized MVP scope and resolved decisions for rules coverage, offline conflict handling, share policy, and PDF fidelity. (Made with OpenCode)

## Summary

Character Core is the players-first foundation for creating, editing, and advancing persistent D&D 5e (2014) player characters.

This feature must feel fast for one-shots and dependable for long campaigns: a player can build a PC, manage core sheet data, level up safely (including multiclass), and save/share/export on desktop or mobile with confidence.

## Must Have

- Signed-in persistent character ownership and storage.
- Support for PCs only in v1.
- 2014 rules support only in v1.
- Rules content comes from imported Rules Catalog data.
- Guided builder plus free-edit sheet workflow.
- First builder step combines concept plus mechanics (`name`, class fantasy/concept, initial mechanical setup).
- End-to-end MVP flow: create -> edit -> level -> save.
- Level-up behavior auto-applies deterministic outcomes and prompts for any player choice.
- Multiclass-aware leveling that suggests main-class progression but requires confirmation.
- Inventory management included in Character Core.
- Spell management included in Character Core.
- Support all official 2014 optional/variant player-facing rules via Rules Catalog imports.
- Validation guardrails with soft warnings and user-overridable conflicts.
- Light custom fields for player-specific entries without full homebrew systems.
- Light continuity support (`level history`, `last updated`, notes).
- Read-only share link with owner-controlled enable/disable toggle.
- PDF export in two formats: official-like field-parity sheet and app-styled summary.
- First-class mobile editing across core flows.
- Offline local draft cache and recovery.
- One-shot speed aid through quick-start presets.

## Nice to Have

- Quick-start preset bundles by play style (one-shot, campaign start, etc.).
- Smart completion hints for missing essentials before first save.
- Optional shared-link activity indicators for owners.
- Suggested starter inventory/spell sets by class and level.

## Non-Goals (MVP)

- 2024 rules support.
- NPC/monster/DM-only sheet workflows.
- Full homebrew builders for classes, races, subclasses, or spell lists.
- Real-time multi-user co-editing.
- Deep campaign journaling/timeline/session log systems.
- Share-link expiration controls.

## Non-Functional Requirements

- Reliability: create/edit/level/save remains deterministic across refresh and re-login.
- Accessibility: core flows are keyboard and screen-reader usable.
- Mobile usability: phone users can complete full MVP flows without desktop fallback.
- Offline resilience: local edits are preserved through connectivity loss.
- Performance: common sheet interactions remain responsive on mid-range devices.
- Maintainability: optional/variant rule coverage stays data-driven through Rules Catalog imports.

## Acceptance Criteria

- A signed-in player can create and save a new 2014 PC end-to-end.
- Guided flow starts with concept plus mechanics and can transition to free edit without data loss.
- A player can level up and save, including multiclass flows with explicit confirmation points.
- Deterministic progression changes auto-apply; choice-based changes always prompt.
- Inventory and spells are editable and persist correctly.
- Optional/variant 2014 rules from the Rules Catalog are available in build/progression behavior.
- Validation conflicts surface as soft warnings and can be overridden by the user.
- Light custom fields persist and do not break core validation.
- Owner can enable/disable read-only sharing; viewers cannot edit shared characters.
- Both PDF formats export successfully.
- Mobile users can complete create/edit/level/save flows.
- Offline edits are cached locally and users are prompted to resolve conflicts against server state.
- Conflict prompt offers clear actions: keep local, keep server, or review differences.
- Product analytics can measure creation completion rate for MVP success tracking.

## Open Questions

- None currently.

## Resolved Decisions

- MVP includes all official 2014 optional/variant player-facing rules, sourced from imported Rules Catalog content.
- Offline/server conflicts use a merge-choice prompt in MVP.
- Read-only share links use owner toggle only in MVP (no expiration).
- Official-like PDF target is field-parity familiarity, not exact visual/legal replica.
- Core success signal is high completion rate for started character creations.

## Related Specs

- `docs/specs/character-core/foundation.md` (to be created)
- `docs/specs/character-core/implementation-plan.md` (to be created)
- `docs/specs/authentication/foundation.md`
- `docs/specs/rules-catalog/catalog-publish-and-rules-catalog-interface.md`

## Related Architecture

- `docs/architecture/app-architecture.md`
- `docs/architecture/global-state-management.md`
- `docs/architecture/catalog-storage-and-read-model.md`
- `docs/architecture/api-error-contract.md`

## Document Health

- Keep this rundown synced with spec and implementation-plan decisions.
- Update changelog immediately when scope or rules-source assumptions change.
