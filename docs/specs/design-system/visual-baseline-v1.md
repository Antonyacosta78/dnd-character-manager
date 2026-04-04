# Spec: Visual Baseline (v1 Preliminary Lock)

## Related Feature

- `docs/features/design-system-foundation.md`

## Context

- The design-system architecture and implementation strategy are already defined, but visual baselines were still open and could drift across contributors and AI agents.
- The team requested a preliminary style lock to keep implementation consistent while preserving the option to revise decisions later.
- This spec records all considered alternatives (option sets discussed) and the selected initial choices.

Decision status:

- `preliminary-approved`
- Decision date: 2026-04-03
- Change policy: selections can be revised by updating this file and linked docs in the same change set.

## Current Plan

Selected baseline combination:

- `1A 2A 3A 4B 5B 6B+Runes 7A 8A 9A 10A`

Quick meaning:

- strong fantasy typography with practical UI readability
- parchment + oxblood + brass color direction
- compact editing density
- near-square shape language
- minimal ornament by default
- Heroicons-based generic icon set plus custom runes for domain semantics
- light motion with strict reduced-motion behavior
- sticky top stat/combat emphasis strip
- left navigation rail with top utility bar
- single global theme for v1; token-pack extension path in v2

### Option Catalog and Selections

#### 1) Font System (display / body / UI)

| Code | Option | Details | Status |
| --- | --- | --- | --- |
| `1A` | `Cinzel` / `Source Serif 4` / `Inter` | Clear fantasy signal in headings, high readability in prose and dense controls, fast web-font integration. | **Selected** |
| `1B` | `Cormorant SC` / `EB Garamond` / `Source Sans 3` | Literary and elegant; slightly softer contrast in compact UI labels. | Not selected |
| `1C` | `Marcellus SC` / `Spectral` / `IBM Plex Sans` | Balanced fantasy-modern blend; cleaner but less iconic than 1A. | Not selected |
| `1D` | `Alegreya SC` / `Alegreya` / `Work Sans` | Warm reading tone and decent utility performance; weaker title impact. | Not selected |
| `1E` | `Uncial Antiqua` / `Crimson Pro` / `Atkinson Hyperlegible` | Very thematic display style with high accessibility potential; harder to keep polished at scale. | Not selected |

Implementation notes:

- Decorative display font is heading-only.
- Body and control text remain legibility-first.

#### 2) Core Color Direction (token seed palette)

| Code | Option | Seed Palette | Details | Status |
| --- | --- | --- | --- | --- |
| `2A` | Parchment + Oxblood + Brass | `bg #F3EBD8`, `surface #E9DFC8`, `ink #2C241D`, `accent #7A1F1F`, `support #A4752B` | Strong codex identity while preserving contrast and hierarchy for dense UI. | **Selected** |
| `2B` | Cool Arcane Ledger | `bg #ECE8DD`, `surface #E2DCCD`, `ink #25272B`, `accent #3F4E7A`, `support #8B6A3F` | Arcane and reserved, less warm/fantasy than 2A. | Not selected |
| `2C` | Ranger Archive | `bg #F1EBDD`, `surface #E7DFCF`, `ink #273126`, `accent #2E5A46`, `support #9C6A3A` | Earthy and grounded; lower immediate codex association. | Not selected |
| `2D` | Noble Chronicle | `bg #F5F0E3`, `surface #EAE2D0`, `ink #1F2430`, `accent #2D4270`, `support #B2873B` | Regal and clear; less parchment-authentic than 2A. | Not selected |
| `2E` | High-Contrast Utility Codex | `bg #F7F4ED`, `surface #ECE7DB`, `ink #1C1A17`, `accent #6B1E1E`, `support #6C5A3A` | Safest readability baseline, weaker signature character. | Not selected |

Implementation notes:

- These are seed values and may be tuned after contrast checks.
- Semantic token names remain the source of truth; do not hardcode these in JSX/TSX.

#### 3) Density Default

| Code | Option | Details | Status |
| --- | --- | --- | --- |
| `3A` | Compact forms + comfortable reading blocks | Dense where users edit frequently, relaxed where users read longer content. | **Selected** |
| `3B` | Uniform compact everywhere | Maximum data density; higher fatigue risk in reading-heavy sections. | Not selected |
| `3C` | Comfortable default everywhere | Easier visual pacing, lower information density for planning tasks. | Not selected |
| `3D` | Responsive density split | Compact desktop + comfortable mobile; good flexibility but more variant complexity. | Not selected |

#### 4) Shape Language (radius / border / elevation)

| Code | Option | Details | Status |
| --- | --- | --- | --- |
| `4A` | Low radius (`~6px`) + subtle shadow | Balanced codex-meets-product style. | Not selected |
| `4B` | Near-square (`~2-4px`) + ledger edge treatment | Hard-edged manuscript ledger feel; boosts seriousness and density alignment. | **Selected** |
| `4C` | Medium radius (`~10-12px`) | Familiar modern product look; weaker thematic identity. | Not selected |
| `4D` | Ornament-heavy frames | High fantasy expression with clutter/performance risk on dense surfaces. | Not selected |
| `4E` | Flat paper layers, border-first | Quiet and readable; less visual hierarchy than 4B without additional rules. | Not selected |

#### 5) Ornament Intensity

| Code | Option | Details | Status |
| --- | --- | --- | --- |
| `5A` | Restrained ornament | Tasteful hierarchy accents; moderate implementation effort. | Not selected |
| `5B` | Minimal ornament | Prioritizes speed and clarity; avoids decorative noise in v1. | **Selected** |
| `5C` | Medium ornament | Good thematic flavor but higher consistency burden. | Not selected |
| `5D` | High ornament everywhere | Strong style statement with high usability risk in forms. | Not selected |
| `5E` | Surface-adaptive ornament | Strong long-term model, more setup complexity now. | Not selected |

#### 6) Icon Strategy

| Code | Option | Details | Status |
| --- | --- | --- | --- |
| `6A` | Lucide base + custom runes | Great utility coverage and easy styling; common in many products. | Not selected |
| `6B` | Heroicons base + custom runes | Slightly stronger geometric presence and good component fit for app shell/nav icons. | **Selected** |
| `6C` | Tabler base + custom accents | Clean and extensive; less aligned with chosen shape language than 6B. | Not selected |
| `6D` | Fully bespoke icon system | Maximum uniqueness with major delivery and maintenance cost. | Not selected |
| `6E` | Minimal icon usage, text-first | Most conservative UX path, least thematic expression. | Not selected |

Selected addendum:

- Use `6B` for generic product/UI actions.
- Add custom rune set for DnD domain semantics (see "Domain Rune Set").

#### 7) Motion Profile

| Code | Option | Details | Status |
| --- | --- | --- | --- |
| `7A` | Lightly expressive (`120-220ms`) + reduced-motion first | Adds polish without harming flow; safest accessibility profile. | **Selected** |
| `7B` | Minimal motion | Very safe and fast; can feel static. | Not selected |
| `7C` | Medium section staggers | Stronger perceived polish; can distract in dense workflows. | Not selected |
| `7D` | Rich animation system | High implementation and accessibility burden. | Not selected |
| `7E` | Contextual motion by surface | Good long-term model; not needed for first lock. | Not selected |

#### 8) Stat/Combat Emphasis Pattern

| Code | Option | Details | Status |
| --- | --- | --- | --- |
| `8A` | Sticky top summary strip | Keeps critical combat/core values in immediate view during editing. | **Selected** |
| `8B` | Sticky left summary rail | Strong desktop ergonomics; harder mobile adaptation. | Not selected |
| `8C` | Section-local summary cards | Simpler implementation, weaker persistent context. | Not selected |
| `8D` | Inline-only emphasis | Minimal layout complexity, weakest cross-section scanability. | Not selected |
| `8E` | Hybrid top desktop + collapsible mobile | Strong responsive behavior; deferred unless mobile pressure requires it. | Not selected |

#### 9) Navigation Shell Style

| Code | Option | Details | Status |
| --- | --- | --- | --- |
| `9A` | Left rail + top utility bar | Best fit for multi-surface dense product workflows. | **Selected** |
| `9B` | Top nav only | Simple shell, weaker information architecture at scale. | Not selected |
| `9C` | Dual-pane editor shell | Powerful for power users, high complexity for v1 baseline. | Not selected |
| `9D` | Command-palette-first shell | Fast for experts, discoverability risk for broader use. | Not selected |
| `9E` | Tabbed workspace shell | Useful for parallel work, not first-priority for v1. | Not selected |

#### 10) Theme Strategy (v1 to v2)

| Code | Option | Details | Status |
| --- | --- | --- | --- |
| `10A` | Single global theme now; token packs in v2 | Controls scope and preserves future world-accent extensibility. | **Selected** |
| `10B` | Light/dark in v1 first | Common expectation but extra complexity for this phase. | Not selected |
| `10C` | Limited world accents in v1 | Early flavor boost with immediate scope expansion risk. | Not selected |
| `10D` | User-custom theming in v1 | High flexibility, high complexity and QA burden. | Not selected |
| `10E` | Hard-lock v1 theme and revisit later | Simplest now, weaker planned extensibility signaling. | Not selected |

### Domain Rune Set (Initial Scope)

Purpose:

- Keep DnD-specific semantics visually distinct from generic app actions.

Initial rune inventory (v1 target):

- `rune-str`, `rune-dex`, `rune-con`, `rune-int`, `rune-wis`, `rune-cha`
- `rune-ac`, `rune-hp`, `rune-init`, `rune-spell-dc`
- `rune-branch`, `rune-world-lock`, `rune-snapshot-frozen`, `rune-invalid-state`

Usage rules:

- Rune + text/number pairing is required for critical semantics.
- Runes should not be the only signal for state or meaning.
- Generic controls continue to use Heroicons.

Styling constraints:

- Monoline construction, consistent stroke weight, legible at `16-20px`.
- Token-driven color usage only.

## Data and Flow

- Decision data in this file flows into:
  - `docs/specs/design-system/foundation.md` (behavior constraints)
  - `docs/specs/design-system/implementation-plan.md` (execution details)
  - `.rulesync/skills/arcane-codex-ui-contract/SKILL.md` (agent behavior contract)
- Implementation components consume these decisions through semantic tokens and component recipes.

## Constraints and Edge Cases

- Decisions are preliminary and can be changed; each change must update this file and related implementation docs together.
- If selected font or color values fail accessibility checks, token values can be tuned without changing option code labels.
- If `8A` creates mobile usability issues, fallback path is `8E` for responsive behavior while keeping desktop `8A` semantics.
- If custom runes delay implementation, ship Heroicons-first with documented placeholders and add runes incrementally.

## Open Questions

- Do we lock exact font weights per role now, or after the first dense-screen visual QA pass?
- Should the domain rune set ship all at once or in two slices (core stats first, branch/snapshot second)?
- Should minimal ornament (`5B`) be revisited after the first feature route migration?

## Related Implementation Plan

- `docs/specs/design-system/implementation-plan.md`
