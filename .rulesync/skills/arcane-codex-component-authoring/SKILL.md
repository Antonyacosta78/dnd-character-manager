---
name: arcane-codex-component-authoring
description: >-
  Govern when and how to create new UI components so Arcane Codex remains
  token-driven, composable, and free of component sprawl.
targets: ["*"]
codexcli:
  short-description: Arcane Codex component authoring guardrails
---

# Arcane Codex Component Authoring Skill

Use this skill whenever a task may create a new component or expand an existing component API.

## Required Inputs

Before authoring, read:

- `docs/architecture/design-system-decision-record.md`
- `docs/specs/design-system/foundation.md`
- `docs/specs/design-system/implementation-plan.md`
- nearest related components under `src/components/**`

If context is incomplete, state assumptions clearly before creating any new component file.

## Component Creation Gate (Mandatory)

A new component is allowed only after these checks:

1. existing component composition cannot solve the task cleanly
2. new behavior/semantics are reused or expected to be reused soon
3. placement layer is explicit (`ui`, `domain`, `patterns`, or route-local)
4. state and accessibility coverage are defined up front

If these checks fail, reuse or refactor existing components instead of creating a new one.

## Placement Rules

- `src/components/ui/*`
  - generic primitive interactions (button, input, dialog shell, table parts)
  - no DnD-specific semantics
- `src/components/domain/*`
  - DnD meaning encoded in the component contract
  - examples: abilities, combat emphasis, branch/snapshot/world lock semantics
- `src/components/patterns/*`
  - route-agnostic composition of `ui + domain` sections
  - owns arrangement and presentational grouping, not data fetching
- route-local component
  - use only when the behavior is truly one-off and unlikely to repeat

Do not put domain semantics into generic primitives.

## API Design Rules

- prefer composition over wide boolean prop matrices
- use typed unions for variants/intents instead of loosely coupled flags
- keep props semantic and minimal; avoid speculative extensibility
- keep `className` pass-through support for layout integration
- user-facing strings should be passed in (or sourced via i18n in route layer), not hardcoded in reusable components

## State and Interaction Coverage

Every new component must explicitly handle relevant states:

- base, hover, focus-visible, active, disabled
- loading, empty, validation error, recoverable failure when applicable
- reduced-motion-safe behavior for animated transitions

Critical signals must not rely on color alone.

## Accessibility Requirements

- semantic element choice first (`button`, `input`, `table`, etc.)
- keyboard-operable interactions and predictable focus order
- visible focus indicators on interactive elements
- dismissible overlays support keyboard escape and explicit dismiss controls
- provide labels/aria attributes when native semantics are insufficient

## Output Contract For Agents

When creating or changing component structure, report:

1. why a new component was needed (or why reuse was chosen)
2. selected layer placement and rationale
3. state/accessibility coverage implemented
4. verification commands run and remaining risks

## Anti-Patterns (Reject)

- creating near-duplicate components with cosmetic differences only
- adding domain-specific meaning into `ui/*` primitives
- introducing one-off utilities instead of reusing token semantics
- shipping interaction components without keyboard/focus behavior
- adding flags to bypass missing composition boundaries

## Quick Review Checklist

- Was component creation justified by the gate?
- Is placement (`ui/domain/pattern/route-local`) correct?
- Are props minimal, typed, and semantic?
- Are state and accessibility paths complete?
- Does implementation align with Arcane Codex token and surface contracts?
