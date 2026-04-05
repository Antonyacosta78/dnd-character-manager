# Spec: App-Shell Navigation Foundation (Baseline 9A)

## Metadata

- Status: `implemented`
- Created At: `2026-04-05`
- Last Updated: `2026-04-05`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-05` - `Antony Acosta` - Marked MVP implementation complete after shipping baseline `9A` shared shell behavior, route wiring, utility/account split, locked destination treatment, tooltip/i18n coverage, and the settings-trigger migration.
- `2026-04-05` - `Antony Acosta` - Created the canonical app-shell navigation foundation contract for baseline `9A`, including IA, routing, permission visibility, utility split, tooltip/i18n requirements, and migration of the temporary floating settings trigger.

## Related Feature

- `docs/features/app-shell-navigation-foundation.md`

## Context

- The app now needs one canonical navigation contract for shared chrome behavior; without it, destination placement, routing semantics, and permission handling will drift across surfaces.
- Scope for this spec is global shell IA only, aligned with roadmap separation from Phase 8 roster discovery behavior.
- The locked shell baseline is `9A` (left rail + top utility bar), with current primary destinations:
  - `Characters`
  - `Worlds`
  - `Adventures`
- Locked submenu mapping:
  - `Branches` under `Characters`
  - `Sessions` under `Adventures`
- Migration dependency is explicit: remove the temporary floating Global Settings trigger in `src/components/patterns/surface-shell.tsx` and provide Settings access through shared navigation utility placement.

## Current Plan

### Scope for this spec

- Define the authoritative IA, interaction, route, and utility behavior contract for shared app-shell navigation.
- Define desktop and mobile submenu behavior and persistence expectations.
- Define locked/permission-limited destination presentation and guidance behavior.
- Define tooltip, label, and localization requirements for nav items.
- Define migration behavior from temporary settings trigger to shared navbar utility action.

### Out of scope for this spec

- Phase 8 roster discovery logic, including:
  - search
  - filtering/facets
  - recents/ranking
  - grouping/discovery heuristics
- New primary destination admission beyond the locked baseline in this document.
- Account profile management or account-preference UI beyond sign-out in account menu.
- Non-navigation feature content within destination pages.

### Feature contract (normative)

1. **Shell baseline contract**
   - Shared authenticated shell must use baseline `9A`: left rail navigation plus top utility bar.
   - Navigation controls must remain label-first (not icon-only as primary affordance).

2. **Destination hierarchy contract**
   - Primary destinations are locked to:
     - `Characters`
     - `Worlds`
     - `Adventures`
   - Submenu entries are locked to:
     - `Branches` under `Characters`
     - `Sessions` under `Adventures`

3. **Utility/account split contract**
   - `Settings` must be exposed as a bottom utility action in shared navigation.
   - Top utility zone must host account menu only.
   - Account menu MVP action scope is sign-out only.

4. **Permission visibility contract**
   - Unavailable destinations must remain visible.
   - Unavailable entries must render locked/disabled treatment with explicit reason and guidance text.
   - Destinations must not be silently hidden as default permission behavior.

5. **Submenu interaction contract**
   - Desktop:
     - submenus default to collapsed
     - user can expand/collapse
     - preference is remembered
   - Mobile:
     - submenus use drill-in panels
     - drill-in flow must include explicit back behavior

6. **Tooltip/label contract**
   - Every navigation item must expose tooltip support.
   - Labels remain the primary signal; tooltips reinforce meaning.
   - Touch users must not rely on long-press tooltip discovery.
   - Adventures tooltip must clarify campaigns + one-shots coverage.

7. **Route contract**
   - Primary routes:
     - `/characters`
     - `/worlds`
     - `/adventures`
   - Collection submenu routes:
     - `/characters/branches`
     - `/adventures/sessions`
   - Entity-scoped submenu routes:
     - `/characters/{id}/branches`
     - `/adventures/{id}/sessions`
   - Active route indication must resolve consistently across desktop rail and mobile drill-in flows.

8. **Migration contract**
   - Replace temporary floating Global Settings trigger in `src/components/patterns/surface-shell.tsx` with shared navbar utility action.
   - Do not leave duplicate Settings entry points after migration.

9. **Accessibility contract**
   - Keyboard navigation and visible focus states are required for rail, utility controls, and mobile overlays.
   - `Esc` must close open drawer/menu overlays.
   - Active route indication must use multiple cues (not color alone).
   - Reduced-motion preference must be respected for navigation transitions.
   - Long localized labels must truncate safely without breaking orientation.

10. **Localization/i18n contract**
    - All user-facing nav labels, tooltips, locked-state reason text, and guidance text must come from translation catalogs (no hardcoded UI copy).
    - Route paths remain locale-neutral for this slice.
    - Catalog updates for nav copy must maintain required locale key parity and follow existing i18n diagnostics/fallback policy.

### MVP nav copy intent (source strings for catalogs)

- `Characters`: "View and manage your character roster."
- `Branches`: "Open alternate builds and timeline branches for a character."
- `Worlds`: "Manage shared world continuity and context."
- `Adventures`: "Browse all your campaigns, one-shots, and short arcs."
- `Sessions`: "View sessions for each adventure and prepare playable versions."
- `Settings`: "Open global app preferences such as theme and language."
- `Account`: "Sign out of this account."

## Data and Flow

Inputs:

- Current route/pathname (untrusted until parsed against known route contract).
- Auth/session-derived destination availability (permission/capability signals).
- Stored submenu expansion preference for desktop (optional, untrusted).
- Translation catalogs for labels/tooltips/reason/guidance copy.
- Viewport/breakpoint context (desktop vs mobile behavior mode).

Transformation path:

1. Shell resolves current route and maps it to primary + submenu active state.
2. Shell loads destination availability states and computes enabled vs locked treatment.
3. Shell renders primary destinations, submenu entries, and utility/account zones using i18n text.
4. Desktop interaction:
   - defaults submenus collapsed
   - user toggles expansion
   - preference is persisted when possible
5. Mobile interaction:
   - user drills into submenu panel
   - explicit back returns to previous panel level
6. Utility interactions:
   - Settings action opens Global Settings surface
   - Account menu exposes sign-out action only

Trust boundaries:

- **Untrusted**: route params/pathname, permission payloads, persisted submenu preference, i18n catalog content from external files.
- **Validated**: recognized route-to-nav mapping, supported destination keys, permission/locked-state mapping with reason code.
- **Trusted internal**: rendered nav view-model used by shell UI.

Outputs:

- Deterministic shell navigation rendering across desktop/mobile.
- Stable active-route and locked-state presentation.
- Single shared Settings entry point in navigation utility area.
- Account menu limited to sign-out action for MVP.

## Constraints and Edge Cases

- **Permission data unavailable/late**
  - Render stable loading/skeleton treatment; do not mislabel unavailable destinations as hidden.
- **Missing locked reason/guidance copy**
  - Use safe localized fallback reason text; never show raw internal error details.
- **Direct deep-link to locked route**
  - Preserve route guard behavior and show recoverable guidance; shell still shows locked nav state.
- **Unknown or unmatched route**
  - No false active highlight; keep shell operable and default to parent destination when derivable.
- **Storage unavailable for submenu preference**
  - Keep functional behavior with default collapsed state; no crash, no hard dependency on persistence.
- **Touch interactions**
  - Labels and explicit helper text must carry meaning without long-press tooltip behavior.
- **Long localized labels**
  - Truncate safely and keep tooltip/title reinforcement so orientation is retained.
- **Duplicate settings access**
  - Temporary floating trigger must be removed once shared utility action exists.
- **Account action creep**
  - Additional account actions are deferred; sign-out only for this phase.
- **Scope discipline**
  - No Phase 8 roster discovery logic may be introduced by this feature.

## Open Questions

- None for current MVP scope.

## Resolved Decisions

- Shell baseline is locked to `9A` (left rail + top utility bar).
- Primary destinations are `Characters`, `Worlds`, and `Adventures`.
- Submenus are `Branches` under `Characters` and `Sessions` under `Adventures`.
- `Settings` is a bottom utility action in shared nav; account menu remains in top utility zone.
- Account menu MVP action scope is sign-out only.
- Permission-limited destinations remain visible with locked/disabled treatment plus reason/guidance.
- Desktop submenus default collapsed, are user-expandable, and remember preference.
- Mobile submenus use drill-in panels with explicit back behavior.
- Tooltips are required for every nav item; labels are primary; touch cannot depend on long-press tooltip.
- Route baseline is:
  - `/characters`, `/worlds`, `/adventures`
  - `/characters/branches`, `/adventures/sessions`
  - `/characters/{id}/branches`, `/adventures/{id}/sessions`
- Phase 8 roster discovery logic is explicitly excluded from this slice.
- Temporary floating settings trigger in `src/components/patterns/surface-shell.tsx` must be replaced by shared navbar utility action.

## Related Implementation Plan

- `docs/specs/navigation/app-shell-navigation-implementation-plan.md`
