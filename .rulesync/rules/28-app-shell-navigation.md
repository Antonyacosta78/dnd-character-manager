---
root: false
targets: ["*"]
description: "App-shell navigation IA and behavior contract for baseline 9A"
globs: ["src/app/**/*", "src/components/**/*", "messages/**/*", "docs/features/app-shell-navigation-foundation.md", "docs/specs/navigation/**/*.md", "docs/architecture/**/*.md"]
opencode:
  description: "App-shell navigation IA and behavior contract for baseline 9A"
---

# App-Shell Navigation

## Source of Truth

- Hard rule: treat `docs/specs/navigation/app-shell-navigation-foundation.md` as the canonical contract for app-shell IA, behavior, and route semantics.
- Use `docs/features/app-shell-navigation-foundation.md` for discovery context, not for overriding the spec.

## Baseline IA Contract (9A)

- Must preserve shell baseline `9A`: left rail + top utility bar.
- Current primary destinations are `Characters`, `Worlds`, `Adventures`.
- Agents may add or change primary destinations only when the task explicitly includes an IA/spec update in the same change set.
- Must keep submenu placement:
  - `Branches` under `Characters`
  - `Sessions` under `Adventures`
- Must not introduce new top-level destinations or submenu groups without a spec update first.

## Primary Destination Admission Guidelines

- A new primary destination must serve a persistent top-level user goal, not a one-off action or settings task.
- A new primary destination must define a canonical top-level route and follow existing route naming conventions.
- A new primary destination must include localized label + tooltip copy, with labels as the primary signal and tooltips as reinforcement.
- A new primary destination must define locked/permission-limited behavior with reason/guidance (visible, not silently hidden).
- A new primary destination must define desktop and mobile behavior (including submenu behavior if applicable).
- A new primary destination must not bundle Phase 8 roster discovery logic into shell IA changes unless explicitly in scope.
- Any new primary destination must update the related feature/spec docs in the same change set before implementation is treated as complete.

## Route Contract

- Current destination routes are:
  - `/characters`, `/worlds`, `/adventures`
- Current collection submenu routes are:
  - `/characters/branches`, `/adventures/sessions`
- Current entity-scoped submenu routes are:
  - `/characters/{id}/branches`, `/adventures/{id}/sessions`
- Agents may add, rename, re-parent, or alias navigation routes only when the task explicitly includes a route/spec update in the same change set.

## Route Admission Guidelines

- A route change must keep top-level navigation routes short, stable, and predictable.
- Collection routes should remain plural and reflect the parent/child IA relationship.
- Entity-scoped routes should keep `{id}`-style segment semantics consistent with existing patterns.
- Route changes must preserve active-nav resolution rules across desktop rail and mobile drill-in flows.
- Route changes must include i18n-safe label/tooltip updates and locked-state reason copy updates when impacted.
- Any route-contract change must update related feature/spec docs in the same change set before implementation is treated as complete.

## Utility Placement Contract

- Must place `Settings` as a bottom utility action in shared navigation.
- Must keep top utility scoped to account menu with MVP action scope of sign-out only.
- Must not add extra account actions to top utility in this phase.

## Permission and Availability Behavior

- Must keep destinations visible when unavailable.
- Must render locked/disabled treatment plus clear reason/guidance for unavailable destinations.
- Must not hide disallowed destinations as the default permission behavior.

## Submenu Interaction Contract

- Desktop:
  - Must default submenus to collapsed.
  - Must allow user-controlled expand/collapse.
  - Must remember user preference.
- Mobile:
  - Must use drill-in panels for submenus.
  - Must provide explicit back behavior.
- Must not rely on desktop submenu behavior patterns on mobile.

## Tooltip and Label Contract

- Must provide tooltip support for every nav item.
- Must keep labels as the primary signal; tooltips are reinforcement.
- Must ensure touch interaction does not depend on long-press tooltip discovery.
- Must include Adventures tooltip guidance clarifying campaigns + one-shots.

## Navigation Chrome Control Density

- Primary destinations and submenu destinations must remain label-first.
- Auxiliary shell controls should prefer icon-only presentation to reduce clutter (for example submenu expand/collapse toggles, mobile back, mobile close, and mobile menu open controls).
- Icon-only controls must provide `aria-label` and `title` text, and retain minimum touch-target sizing.

## Scope Boundary

- Must not mix Phase 8 roster discovery logic into shell IA work:
  - search/filter/recents/grouping/ranking are out of scope for this contract.

## Migration Requirement

- Must replace temporary floating Global Settings trigger in `src/components/patterns/surface-shell.tsx` with the shared navbar utility action.
- Must not keep duplicate Settings entry points after migration.

## I18n + Documentation Updates

- Must route user-facing nav labels/tooltips/reason text through translation catalogs.
- Must update navigation spec/docs before or alongside behavior changes that alter IA/contract.
