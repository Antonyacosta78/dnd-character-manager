# Feature Rundown: Design System Foundation (Arcane Codex v1)

## Metadata

- Status: `proposed`
- Created At: `2026-04-03`
- Last Updated: `2026-04-04`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-04` - `Antony Acosta` - Corrected status to match current implementation reality; design-system foundation remains proposed while implementation has not started. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Backfilled metadata and changelog sections for lifecycle tracking. (Made with OpenCode)
- `2026-04-03` - `Antony Acosta` - Initial document created.

## Summary

Establish the first usable design system for the app so new UI can ship with a consistent fantasy editorial identity instead of generic starter styling.

This feature gives the team and AI agents a shared baseline for tokens, primitives, domain-focused components, and state handling. The goal is to improve clarity and speed at the same time: faster implementation now, less visual drift later.

## Must Have

- Semantic design tokens for color, typography, spacing, radius, and motion.
- Two explicit surface modes:
  - `workbench` for dense editing/planning
  - `codex` for reading/presentation-heavy sections
- Core UI primitives with complete interaction states (focus, disabled, error, etc.).
- Initial domain UI components for high-priority semantics (core stats, combat emphasis, branch/world lock, snapshot frozen state).
- Required page-state coverage for new surfaces: loading, empty, validation error, recoverable failure.
- Reduced-motion support for any introduced animation.
- One reference implementation screen that demonstrates the baseline system in practice.

## Nice to Have

- Early token registry doc with examples of correct/incorrect usage.
- Minimal bespoke icon/rune subset for domain semantics.
- Additional codex ornament utilities for read-only surfaces.
- A review checklist artifact for agent-generated UI diffs.

## Non-Functional Requirements

- Accessibility: practical WCAG AA baseline for core interactions.
- Performance: no heavy visual effects that degrade form-heavy interaction.
- Responsiveness: desktop-first behavior with usable mobile adaptation.
- Maintainability: component APIs remain small and composable; avoid wide prop-flag APIs.
- Consistency: no hardcoded ad hoc color values in component JSX/TSX.

## Acceptance Criteria

- New foundation tokens exist and are consumed by base UI styles.
- Starter scaffold visuals are replaced by Arcane Codex baseline treatment.
- Core primitives used by the reference screen include complete interaction states.
- Domain emphasis elements (abilities/combat/branch/snapshot) are visually distinct and consistent.
- Reference screen shows explicit loading, empty, and error/invalid guidance states.
- Motion behavior respects `prefers-reduced-motion` and app-level override strategy.
- `bun run lint` passes for implementation changes.

## Open Questions

- Final font trio lock after readability checks on dense layouts.
- Whether bespoke rune/icon language lands in v1 or v1.1.
- Whether to keep one combined reference page or split `workbench` and `codex` demos by route.

## Related Specs

- `docs/specs/design-system/foundation.md`
- `docs/specs/design-system/visual-baseline-v1.md`
- `docs/specs/design-system/implementation-plan.md`

## Related Architecture

- `docs/architecture/design-system-decision-record.md`
- `docs/architecture/app-architecture.md`
