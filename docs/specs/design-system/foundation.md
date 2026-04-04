# Spec: Design System Foundation (Arcane Codex v1)

## Related Feature

- `docs/features/design-system-foundation.md`

## Context

- The current app UI is a starter scaffold and does not represent product identity or information hierarchy required by the roadmap.
- The product's core loop (`create -> plan -> branch -> assign -> snapshot -> export`) is dense, stateful, and rules-sensitive, so visual inconsistency directly harms trust and speed during real use.
- The team explicitly prefers Tailwind-native implementation with fast delivery and strong customization control.
- AI agents are expected to contribute heavily; without strict contracts they tend to reintroduce generic UI patterns and inconsistent state semantics.

This spec defines the technical contract for the first design-system slice so implementation can proceed with bounded scope and predictable outcomes.

## Current Plan

- Implement a code-owned, token-driven design system based on local primitives and domain components.
- Keep interaction and accessibility quality from mature primitive patterns while replacing default aesthetics with Arcane Codex styling.
- Use `docs/specs/design-system/visual-baseline-v1.md` as the preliminary visual lock for fonts, palette direction, density, icon strategy, and shell patterns.
- Apply surface-intent split:
  - `workbench`: dense editing/planning surfaces with restrained ornament.
  - `codex`: reading/presentation surfaces with richer editorial treatment.
- Enforce semantic visual mapping for domain-critical states (abilities, combat, world lock, snapshot frozen).
- Require explicit state handling (loading, empty, validation, recoverable failure) on page-level surfaces touched by this feature.

Technical contract by layer:

1. **Token layer**
   - Semantic CSS variables (color, typography, spacing, radius, shadow, motion, domain).
   - Tailwind mappings consume semantic tokens, not direct palette values.
2. **Primitive layer**
   - Shared `ui/*` components expose consistent variant, density, and focus/error behavior.
3. **Domain layer**
   - DnD semantics are encoded through dedicated components (`AbilityBlock`, `CombatBadge`, `WorldLockPill`, etc.).
4. **Pattern layer**
   - Reusable layout compositions combine domain + primitives for feature routes.
5. **Route composition layer**
   - Routes provide data/state and compose patterns without styling ad hoc semantics.

Guardrails:

- No hardcoded ad hoc color literals in component JSX/TSX.
- No new UI library adoption without an architecture decision update.
- No decorative-only signaling for critical state.
- No heavy background texture under editable form text.
- Motion must respect reduced-motion settings.

Tradeoff stance:

- Prefer clarity and consistency over visual complexity.
- Permit visual restraint in `workbench` when it improves task throughput.
- Accept early setup cost in exchange for lower long-term entropy and better AI output quality.

## Data and Flow

Inputs:

- route-level view models (mock or real)
- domain values (ability scores, combat values, branch/snapshot state)
- UI status signals (loading, empty, validation, operation error)

Transformation path:

1. Route/page passes typed view models to pattern components.
2. Pattern components map view data to domain props.
3. Domain components map semantic meaning to primitive variants.
4. Primitive variants resolve to semantic token classes and CSS variables.
5. Rendered output communicates hierarchy and state consistently across breakpoints.

Trust boundaries:

- **Untrusted**: user-entered form values and route/query inputs.
- **Validated**: route/form boundary before semantic rendering.
- **Trusted internal**: token registry + component variant contracts.

Outputs:

- deterministic, tokenized UI behavior that is reviewable and reusable
- explicit state surfaces instead of implicit fallback rendering
- stable contracts for AI-assisted implementation

Shared references:

- `docs/architecture/design-system-decision-record.md`
- `docs/architecture/app-architecture.md`

## Constraints and Edge Cases

- **Dense layout pressure**
  - Compact UI is allowed, but text legibility and focus visibility are mandatory.
- **Mobile compression**
  - Preserve stat/combat emphasis while allowing staged disclosure for secondary details.
- **Missing optional values**
  - Optional combat/domain fields render explicit placeholder semantics, not misleading defaults.
- **Motion sensitivity**
  - `prefers-reduced-motion` and app override behavior are required where motion exists.
- **Long labels/content**
  - Long names/titles must wrap without breaking key stat blocks or control alignment.
- **Error clarity**
  - Validation and recoverable failures must be explicit; no silent blank panels.
- **Style drift risk**
  - New screens must reuse primitives/domain components before inventing local styling structures.
- **Fail-open vs fail-closed**
  - Fail-closed for semantic validity indicators.
  - Fail-open for ornamental enhancements (functional UI remains usable if decorative styling fails).

## Open Questions

- Does preliminary `1A` typography pass dense-screen readability QA, or should fallback `1C` be used for control-heavy views?
- Should custom rune rollout happen in one slice or two slices (core stat/combat first, branch/snapshot second)?
- Should `8A` stay universal, or switch to `8E` adaptation on smaller viewports after first mobile pass?
- Should runtime schema validation at pattern boundaries be added in this slice or deferred one iteration?

## Related Implementation Plan

- `docs/specs/design-system/implementation-plan.md`
