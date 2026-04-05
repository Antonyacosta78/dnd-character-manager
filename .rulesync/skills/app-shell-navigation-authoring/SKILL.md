---
name: app-shell-navigation-authoring
description: >-
  Implement app-shell navigation changes safely using the locked 9A IA, route
  contract, permission visibility rules, and utility/menu behavior boundaries.
targets: ["*"]
codexcli:
  short-description: App-shell navigation implementation workflow for locked 9A baseline
---

# App-Shell Navigation Authoring Skill

Use this skill when editing shared shell navigation, nav routes/menus, nav utility actions, or nav permission presentation.

## Do Not Use This Skill When

- the task is Phase 8 roster discovery behavior (search/filter/recents/grouping/ranking)
- the task is unrelated page content work with no shell nav impact
- the task is broad design-system component authoring better handled by dedicated UI component skills

## Required Inputs

Before implementation, read:

- `docs/features/app-shell-navigation-foundation.md`
- `docs/specs/navigation/app-shell-navigation-foundation.md`
- `.rulesync/rules/28-app-shell-navigation.md`
- any touched shell/nav components (including `src/components/patterns/surface-shell.tsx`)
- relevant translation files under `messages/**/*` for nav copy changes

## Implementation Workflow

1. **Scope gate**
   - confirm the change belongs to app-shell nav (not roster discovery logic)
   - treat current IA/routes as baseline defaults; allow additions/changes only when task explicitly includes feature/spec updates in the same change set

2. **IA + route mapping**
   - current primary destinations: Characters, Worlds, Adventures
   - current submenu mapping: Branches under Characters, Sessions under Adventures
   - current route conventions:
     - `/characters`, `/worlds`, `/adventures`
     - `/characters/branches`, `/adventures/sessions`
     - `/characters/{id}/branches`, `/adventures/{id}/sessions`
   - if adding a new primary destination, verify it has a persistent top-level user goal, canonical route, localized label/tooltip, locked-state behavior, and desktop/mobile behavior definition
   - if changing route structure, keep naming stable/predictable and update active-nav resolution for both desktop rail and mobile drill-in flows

3. **Utility and account split**
   - keep Settings as bottom utility action
   - keep top utility as account menu with MVP sign-out only
   - remove/avoid duplicate Settings triggers (migrate from floating trigger)

4. **Availability + guidance behavior**
   - keep unavailable destinations visible
   - render disabled/locked state with explicit reason/guidance
   - avoid silent hiding of unavailable destinations

5. **Desktop/mobile submenu behavior**
   - desktop: collapsed by default, user-expandable, preference remembered
   - mobile: drill-in submenu panels with explicit back behavior

6. **Tooltip + copy contract**
   - ensure every nav item has tooltip support
   - keep label as primary signal
   - ensure touch users are not blocked by long-press-only behavior
   - include Adventures tooltip clarification for campaigns + one-shots
   - route all user-facing text through i18n catalogs

7. **Control density pass**
   - keep primary destinations and submenu destinations label-first
   - render auxiliary shell controls as icon-only where text adds clutter (submenu toggles, mobile open/back/close)
   - ensure icon-only controls include `aria-label` + `title` and keep reliable hit-target sizing

## Required Checks

- Run `bun run lint` when TS/React/UI code changes.
- Manually verify nav interactions:
  1. desktop: submenu default collapsed and preference persists
  2. mobile viewport: submenu drill-in and explicit back flow
  3. unavailable destination: still visible, disabled/locked, reason shown
  4. tooltips available for each nav item; labels still visible as primary
  5. Settings appears in shared nav utility; floating trigger removed
  6. auxiliary controls are icon-only and still accessible (`aria-label`/`title` present)

## Output Contract For Agents

When returning work, include:

1. scope decision (what stayed in-shell vs what was excluded)
2. IA/route baseline confirmation and any explicit spec delta applied in the same change set
3. utility/account split confirmation and migration status
4. permission/tooltip/mobile-desktop behavior confirmation
5. verification run(s) and any remaining gaps/risks
