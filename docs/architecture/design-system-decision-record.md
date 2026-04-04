# Architecture: Design System Decision Record

## Metadata

- Status: `accepted`
- Created At: `2026-04-03`
- Last Updated: `2026-04-04`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-03` - `Antony Acosta` - Initial document created.
- `2026-04-04` - `OpenCode` - Backfilled metadata and changelog sections for lifecycle tracking.

## Purpose

Define the official UI style and design system direction for v1 so senior engineers and AI coding agents can ship fast without drifting into generic SaaS UI patterns or inconsistent fantasy styling.

This document is intentionally prescriptive. It exists to reduce ambiguity in implementation decisions.

## Decision Details

- Decision owner: product lead and senior engineering
- Primary audience: senior web developers and AI coding agents
- Scope: web app UI for v1 and the extension path for v2 theming

## Executive Decision

The project adopts a **Tailwind-native custom design system** built on **shadcn/ui + Radix primitives** as the behavior foundation, with a custom fantasy visual layer named **Arcane Codex**.

This is not a default shadcn look-and-feel.

It is a structured skin-and-pattern system that:

- keeps accessibility and interaction quality from mature primitives,
- delivers a strong Homebrewery-inspired editorial fantasy identity,
- supports dense character-sheet style information,
- keeps implementation velocity high,
- and preserves a low-friction path for v2 world-specific accents.

## Context

### Product constraints

- Product shape is form-heavy, rules-heavy, and state-heavy.
- Trust and legibility beat ornamentation when they conflict.
- Core flow is `create -> plan -> branch -> assign -> snapshot -> export`.
- Desktop-first for v1, with mobile support that is practical rather than identical.

### Team constraints

- Speed to usable v1 matters more than design perfection.
- No paid kits.
- Tailwind-first is preferred over CSS-in-JS due to performance and operational simplicity.
- Main contributors include AI agents that require explicit rules.

### Style constraints

- UI must feel thematic and distinctive, not corporate template UI.
- Inspiration references:
  - Homebrewery editorial parchment presentation
  - DnD Beyond product-grade clarity and hierarchy

## Goals

1. Ship quickly with a consistent, non-generic UI language.
2. Keep data-dense screens readable and scannable.
3. Encode visual identity through tokens and component recipes, not one-off CSS.
4. Make AI-generated UI changes predictable and reviewable.
5. Keep v2 theming extension cheap.

## Non-Goals

- Build a fully bespoke component and interaction library from zero.
- Recreate a parchment texture on every UI surface.
- Optimize for visual novelty over task completion.
- Introduce multi-theme world styling in v1 production scope.

## Options Considered

### Option A: shadcn/ui + Radix + custom Arcane Codex skin (selected)

Strengths:

- Tailwind-native and code-owned components.
- Excellent customization headroom.
- Strong accessibility baseline through Radix primitives.
- Easy to enforce local conventions for AI agents.

Tradeoffs:

- Requires upfront token and recipe discipline.
- More initial setup than drop-in pre-styled systems.

### Option B: HeroUI v3 as main system

Strengths:

- Rich component coverage with strong accessibility story.
- Fast initial assembly of product surfaces.
- Tailwind v4-compatible theming model.

Tradeoffs:

- Higher chance of inheriting default aesthetic if not aggressively reskinned.
- Less direct control than code-owned local primitives for long-term identity shaping.

### Option C: Flowbite React or daisyUI as main system

Strengths:

- Very high short-term shipping speed.
- Broad component availability.

Tradeoffs:

- Strong risk of generic template look.
- More work to reach stable fantasy brand expression without style entropy.
- Interaction semantics and edge-state rigor are less aligned with high-complexity product flows.

## Weighted Decision Matrix

Scale: 1 (poor) to 5 (excellent)

| Criterion | Weight | Option A | Option B | Option C |
| --- | ---: | ---: | ---: | ---: |
| Tailwind-native integration | 5 | 5 | 4 | 5 |
| Identity customization headroom | 5 | 5 | 4 | 3 |
| Accessibility + interaction reliability | 5 | 5 | 5 | 3 |
| Data-dense UI suitability | 4 | 5 | 4 | 3 |
| AI-agent implementation controllability | 5 | 5 | 4 | 3 |
| Initial implementation speed | 4 | 4 | 5 | 5 |
| Long-term maintainability | 5 | 5 | 4 | 3 |
| **Weighted total** |  | **121** | **110** | **90** |

Option A wins due to the best balance of speed, identity control, and long-term maintainability.

## Final Architecture Decision

### Layer model

The UI system is implemented in five layers:

1. **Token layer**: semantic design tokens in CSS variables (color, type, spacing, radius, shadows, motion).
2. **Primitive component layer**: adapted `ui/*` components built from shadcn/Radix patterns.
3. **Domain component layer**: DnD-specific components (`AbilityBlock`, `CombatBadge`, `BranchRibbon`, etc.).
4. **Pattern layer**: reusable screen patterns (editable stat grid, progression table, branch timeline panel).
5. **Page composition layer**: route-level assembly and content decisions.

Rule: lower layers cannot depend on higher layers.

### Surface model

Two surface modes are officially supported:

- **Workbench mode**: primary mode for editing/planning screens. Dense, highly legible, restrained ornament.
- **Codex mode**: reading/presentation mode for sheet views, summaries, exports, and context panels. Richer editorial styling.

Rule: do not force Codex ornamental density into high-frequency editing interactions.

## Visual Style System: Arcane Codex v1

### Visual principles

1. Editorial fantasy, not game launcher glam.
2. Ink-first readability.
3. Ornament only where hierarchy benefits.
4. Mechanical truth is visually explicit (stats, validity, lock/freeze states).
5. Distinctive but calm.

### Color strategy

Use semantic tokens only. No hard-coded hex in component JSX.

Base token families:

- Canvas and surfaces: `--bg-canvas`, `--bg-surface`, `--bg-elevated`, `--bg-muted`
- Text and borders: `--fg-primary`, `--fg-secondary`, `--fg-muted`, `--border-default`, `--border-strong`
- Brand accents: `--accent-rubric`, `--accent-brass`, `--accent-arcane`
- State colors: `--state-info`, `--state-success`, `--state-warning`, `--state-danger`
- Domain semantics:
  - `--domain-stat-core`
  - `--domain-stat-combat`
  - `--domain-branch`
  - `--domain-world-lock`
  - `--domain-snapshot-frozen`

Guideline:

- Use one primary accent (`rubric`) and one support accent (`brass`) per screen.
- Keep accent usage under 15 percent of visual area in dense forms.

### Typography strategy

Use three role-based families:

- **Display serif**: headings, section titles, major labels.
- **Body serif**: long-form lore and codex reading.
- **UI sans**: controls, tables, metadata, and compact labels.

Rules:

- No decorative fantasy type in form controls.
- Minimum body size for editable dense surfaces: 14px equivalent.
- Provide explicit uppercase/small-caps style tokens rather than ad hoc letterspacing.

Recommended open-source font candidates:

- Display serif: `Cinzel` or `Cormorant SC`
- Body serif: `Source Serif 4` or `EB Garamond`
- UI sans: `Inter` or `Work Sans`

Final font picks must be measured for readability in dense tables before lock-in.

### Ornament strategy

Allowed ornament primitives:

- subtle paper grain background on codex surfaces only
- section divider rules with restrained flourish
- drop caps for long-form codex prose only
- illuminated panel corners for summary cards only

Prohibited ornament use:

- texture behind editable input text
- decorative borders on every card by default
- high-contrast background illustrations on data grids

## Interaction and Accessibility Standards

### Accessibility baseline

v1 baseline is practical WCAG AA alignment for core interactions.

Must-have requirements:

- keyboard access for all interactive controls
- visible focus ring on every interactive element
- semantic labels and descriptions for form fields
- meaningful error messaging tied to fields
- color is not the only validity signal
- reduced motion support at system and app level

### Motion policy

Motion is lightly expressive, not ornamental noise.

Approved motion types:

- short fades/slides for panel appearance
- subtle emphasis for important state changes
- progressive reveal for major section load

Hard constraints:

- support `prefers-reduced-motion`
- include app-level override token/attribute
- do not animate large layout shifts on edit-heavy forms

### Density policy

Desktop target: information-rich workbench surfaces.

Mobile target: preserve key workflows with staged disclosure.

Rules:

- In dense mode, controls can be compact but must preserve 44px touch targets on mobile.
- Combat and core stat blocks remain visually anchored at top or sticky region where practical.

## Component Standards

### Primitive component policy

Required primitives for v1 foundation:

- Button
- Input
- Textarea
- Select / Combobox
- Checkbox / Radio / Switch
- Tabs
- Tooltip
- Dialog / Drawer
- Table
- Badge
- Alert
- Skeleton
- Toast

Each primitive must define:

- default, hover, focus-visible, active, disabled states
- error/success/warning variants where relevant
- compact and default density variants
- reduced-motion compliant transitions

### Domain component policy

Required domain components in v1:

- `AbilityBlock`
- `CombatBadge`
- `SaveRow`
- `BranchRibbon`
- `WorldLockPill`
- `SnapshotSeal`
- `ProgressionStep`
- `ValidationCallout`

Rule: do not represent domain states using generic `Card` + random utility classes when a domain component exists.

### State completeness policy

Every page-level feature must explicitly handle:

- loading
- empty
- validation error
- permission or ownership failure
- recoverable operation failure

No state may be represented by a silent blank container.

## Tokens and Theming Implementation Spec

### Token source of truth

Single source of truth: root token definitions in global style layer plus typed token mapping docs.

Implementation rule:

- Components consume semantic CSS variables.
- Tailwind utilities map to semantic variables.
- Avoid direct color literals in component code.

### Naming convention

Token naming format:

- `--color-*` for semantic colors
- `--font-*` for font roles
- `--space-*` for spacing scale
- `--radius-*` for corner radius
- `--shadow-*` for elevation
- `--motion-*` for duration/easing
- `--domain-*` for DnD-specific semantics

### v2 theming extension path

World-specific flavor in v2 should be implemented as additive token packs:

- base theme remains default
- world pack overrides accent/domain tokens only
- primitives and domain components remain unchanged

No per-world custom CSS files per route.

## AI Agent Implementation Protocol

This section is normative for all AI-generated UI code.

### Mandatory rules

1. Use existing primitives and domain components before creating new ones.
2. Use semantic tokens only; do not hard-code arbitrary color values in JSX/TSX.
3. Keep server components by default; use client components only for required interactivity.
4. Preserve desktop and mobile behavior.
5. Implement loading/empty/error states for new feature surfaces.
6. Add motion only when it supports comprehension; include reduced-motion behavior.
7. Do not introduce new UI libraries without an explicit decision update.

### Review checklist for AI PRs

- Does this change use existing token semantics?
- Does it look like Arcane Codex, not default starter UI?
- Are focus states and keyboard paths intact?
- Are domain-critical values visually prioritized?
- Are all required states represented?
- Is the component API simple and composable?

## Delivery Plan

### Phase 1: Foundation (immediate)

- establish token set
- establish typography roles
- create base app shell styling
- adapt core primitives to Arcane Codex skin

Exit criteria:

- no direct palette literals in new components
- app shell and primitive controls share one coherent visual language

### Phase 2: Domain layer (short-term)

- implement v1 domain components
- codify stat/combat emphasis treatment
- build progression and branch pattern blocks

Exit criteria:

- no feature screen models branch/snapshot semantics with generic styles only

### Phase 3: Pattern hardening (mid-term)

- codify page patterns for create, plan, branch, snapshot, export
- add consistency checks for state handling
- optimize density behavior on smaller breakpoints

Exit criteria:

- all core loop screens share consistent hierarchy and state behavior

## Quality Gates

Minimum quality gates for design system work:

- lint pass (`bun run lint`)
- manual keyboard traversal check on changed screens
- reduced-motion behavior check on changed animated surfaces
- visual check on one desktop width and one mobile width

When any gate is skipped, the exact gap must be documented in the change note.

## Risks and Mitigations

### Risk: over-decoration hurts productivity

Mitigation:

- enforce Workbench vs Codex surface policy
- keep decorative elements out of dense edit controls

### Risk: style drift from ad hoc utility use

Mitigation:

- require token semantics
- centralize component recipes
- reject one-off visual hacks in review

### Risk: AI-generated generic UI regressions

Mitigation:

- enforce AI protocol checklist
- require domain components for domain semantics

### Risk: performance regressions from texture and effects

Mitigation:

- use lightweight CSS effects
- avoid large fixed backgrounds in interactive surfaces
- measure before introducing expensive effects

## Governance and Change Management

This record is the source of truth for design system direction.

A change requires:

1. explicit rationale,
2. impact analysis on existing primitives and domain components,
3. migration plan if breaking,
4. update to this document in the same PR or change set.

## Open Questions

- Final font family selection after readability testing on dense progression tables.
- Whether to formalize codex export-specific components separately from app runtime components.
- Whether icon strategy should include a custom rune set in v1 or v1.1.

## References

- `README.md`
- `docs/ROADMAP.md`
- `docs/specs/design-system/visual-baseline-v1.md`
- `docs/architecture/app-architecture.md`
- `https://ui.shadcn.com`
- `https://github.com/shadcn-ui/ui`
- `https://www.radix-ui.com`
- `https://heroui.com/docs/react/releases/v3-0-0`
- `https://flowbite-react.com/docs/getting-started/license`
- `https://daisyui.com`

## Appendix A: Practical Styling Do and Do Not

### Do

- emphasize hierarchy with typography and spacing before color effects
- keep stat clusters consistently structured across pages
- use subtle texture and rules to create codex atmosphere
- use the same semantic token for the same meaning everywhere

### Do Not

- ship default unmodified starter-kit component styling
- use decorative fonts in compact editable controls
- encode semantic states with random local utility colors
- use dense ornament on mobile forms

## Appendix B: Suggested Initial Token Skeleton

```css
:root {
  --color-bg-canvas: oklch(0.97 0.01 85);
  --color-bg-surface: oklch(0.95 0.015 85);
  --color-bg-elevated: oklch(0.99 0.005 85);
  --color-fg-primary: oklch(0.24 0.02 70);
  --color-fg-secondary: oklch(0.38 0.02 70);
  --color-border-default: oklch(0.78 0.02 75);
  --color-accent-rubric: oklch(0.45 0.12 28);
  --color-accent-brass: oklch(0.62 0.09 78);

  --domain-stat-core: oklch(0.36 0.08 50);
  --domain-stat-combat: oklch(0.42 0.14 25);
  --domain-branch: oklch(0.47 0.1 300);
  --domain-world-lock: oklch(0.5 0.09 250);
  --domain-snapshot-frozen: oklch(0.4 0.03 220);

  --motion-fast: 120ms;
  --motion-base: 180ms;
  --motion-soft: 260ms;
}
```

Note: values above are a starter baseline, not a final color lock.
