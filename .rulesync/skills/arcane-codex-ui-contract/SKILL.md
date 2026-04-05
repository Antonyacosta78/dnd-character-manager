---
name: arcane-codex-ui-contract
description: >-
  Enforce the Arcane Codex design-system contract for UI implementation so
  changes stay thematic, accessible, dense-data friendly, and token-driven.
targets: ["*"]
codexcli:
  short-description: Arcane Codex UI implementation contract
---

# Arcane Codex UI Contract

Use this skill for any UI work that touches layout, visual styling, components, or interaction states.

This is a normative contract. Treat requirements below as default policy unless the user explicitly requests an exception.

## Required Inputs

Before implementing, read:

- `docs/architecture/design-system-decision-record.md`
- `docs/specs/design-system/implementation-plan.md`
- `docs/specs/design-system/visual-baseline-v1.md`

If any file is missing or outdated relative to the task, report the gap first and proceed with the closest safe assumptions.

## Priority Order

When constraints conflict, decide in this order:

1. correctness and usability for play-critical tasks
2. accessibility and clarity
3. consistency with Arcane Codex token semantics
4. implementation simplicity and maintainability
5. decorative styling

## Hard Rules

1. Use semantic design tokens; do not hardcode random color literals in JSX/TSX.
2. Reuse local primitives/domain components before creating new component families.
3. Keep server components by default; add client components only when interaction requires it.
4. Provide complete states on new surfaces: loading, empty, validation error, recoverable failure.
5. Keep Workbench surfaces dense and legible; do not overload edit-heavy UI with ornament.
6. Support reduced motion for any animated behavior.
7. Keep core stat/combat values visually emphasized and consistently placed.

## Arcane Codex Styling Rules

- Prefer editorial fantasy tone over corporate dashboard defaults.
- Use ornament as hierarchy support, not as continuous decoration.
- Keep data-entry text zones clean (no heavy textures behind form text).
- Keep base UI defaults aligned with current lock: `2D` (Noble Chronicle) + `bookish` typography stack.
- Treat additional palette/font variants as Theme Selector behavior, not ad hoc route-level overrides.
- Use typography roles intentionally:
  - display serif: headings and section markers
  - body serif: longer codex prose
  - UI readable serif by default in this slice; alternate stacks may be applied only through Theme Selector controls

## Implementation Workflow

1. identify whether the surface is `workbench` or `codex`
2. select existing primitives/domain components to reuse
3. map visual semantics to tokens before writing component markup
4. implement with minimal API complexity
5. verify keyboard focus visibility and reduced-motion behavior
6. run minimal quality checks and report any verification gaps

## Output Contract For Agents

In substantial responses, include:

1. what changed and why
2. token/component semantics chosen
3. state coverage implemented
4. verification steps run and remaining gaps

## Anti-Patterns (Reject)

- introducing new UI libraries without a design decision update
- shipping default starter-kit styles without Arcane Codex adaptation
- using generic cards/badges where domain components are expected
- adding decorative motion that competes with core task readability
- using many behavior flags when composition is cleaner

## Quick Review Checklist

- Does this look like Arcane Codex instead of generic SaaS?
- Are token semantics used consistently?
- Are domain-critical values easy to scan?
- Are keyboard and reduced-motion paths intact?
- Are loading/empty/error states explicit?
