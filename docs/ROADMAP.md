# Roadmap

This document captures the current product roadmap for the D&D Character Manager.

It is a planning guide, not a promise. The goal is to keep the project focused on the core loop we agreed on:

`create character -> plan progression -> branch when needed -> assign to game -> freeze snapshot -> export playable sheet`

## Product Direction

The app is a character-first D&D 5e 2014 manager for a group that plays mostly one-shots, short arcs, and shared-world games with rotating players.

The product should feel strongest at three things:

- creating a character cleanly and confidently
- managing multiple versions of that character across levels, worlds, and games
- producing a trustworthy sheet that is ready for play

## Planning Rules

- Protect the core character loop before adding side systems.
- Prefer gameplay readiness over narrative depth.
- Keep the app character-first, not campaign-first.
- Support the group's most-used 5e 2014 material before broader source coverage.
- Allow rule-bending, but keep it visible.

## Current Roadmap

## Implementation Snapshot

Last verified: 2026-04-05 (post-registration smoke test sync)

Detailed evidence and checklist: `docs/STATUS.md`

- Phase 0 - Foundation: completed
- Phase 1 - Authentication And Identity: in-progress
- Phase 2 - Character Core: planned
- Phase 3 - Progression Planning: planned
- Phase 4 - Branching And Timelines: planned
- Phase 5 - Games, Worlds, And Snapshots: planned
- Phase 6 - Playable Output: planned
- Phase 7 - Roster And Navigation: planned
- Phase 8 - History And Comparison: planned

## Phase 0 - Foundation

Goal: establish the project shape, vocabulary, and constraints before feature work gets too wide.

- product thesis and README
- shared terminology for character, branch, world, game, and snapshot
- docs workflow for feature rundowns, specs, and implementation plans
- architecture notes for app shape, parsing, and data sources
- i18n foundation direction (locale strategy, fallback behavior, and doc linkage)

Status: completed

## Phase 1 - Authentication And Identity

Goal: make user identity and ownership first-class before character records become persistent player libraries.

- support account registration and sign-in plus session lifecycle via the app auth surface
- enforce ownership boundaries so character and related records are scoped to the signed-in user
- define clear unauthenticated behavior for page and API access
- provide a minimal authentication entry flow that can be expanded later without data model churn
- keep auth focused on single-user ownership and safety, not social or collaboration features

This phase should end with app behavior that treats identity as real from day one, while keeping the first UI slice intentionally lean.

## Phase 2 - Character Core

Goal: make it possible to create a real character and manage it as a persistent identity.

- create a base character with name, lore, background, starting stats, class, and other identity fields
- support standard 5e 2014 character creation paths for stats
- model the base sheet data needed for a playable character
- allow character statuses such as active, retired, backup, dead, and concept-only
- duplicate a character's mechanical template into a new separate record

This phase should end with the app feeling like a usable character library, even before branching and games are fully present.

## Phase 3 - Progression Planning

Goal: let players define a character from level 1 up to a target level `N`.

- plan level-by-level progression
- support partially defined futures
- calculate derived values automatically as levels are added
- support multiclassing
- support subclass choices, feats, spells, proficiencies, HP growth, and class features
- require missing levels to be defined before generating a higher-level playable version
- warn on invalid or unusual builds without hard blocking them

This is the first point where the product starts feeling better than a static sheet.

## Phase 4 - Branching And Timelines

Goal: deliver the product's signature behavior.

- each character has a default main progression
- users can branch from an earlier level into an alternate version
- branches are world-locked once created
- edits at an earlier level recalculate what they can in that branch
- when later levels become invalid after an earlier change, guide the user through fixing them
- allow players to return to an earlier canonical level and branch from there if needed
- show branch summaries from the base character view

This phase is the heart of the app. If it is weak, the product becomes just another sheet builder.

## Phase 5 - Games, Worlds, And Snapshots

Goal: connect characters to actual play.

- create worlds as shared continuity containers
- create games with at least `name`, `DM`, and `world`
- prepare for a session with the flow `pick game -> assign character -> choose or create version`
- generate a frozen snapshot from a branch and level when a character joins a game
- allow the same branch to appear in multiple games within the same world
- keep snapshots stable even if the source branch changes later
- record which versions were used in which games

This phase turns progression planning into real table history.

## Phase 6 - Playable Output

Goal: make the app usable as a real pre-game tool.

- generate a playable version from any fully defined level
- support the standard 4-page printable 5e character sheet
- export a clean PDF for printing or sharing offline
- make sheet reading comfortable on desktop and acceptable on mobile
- prioritize trustworthy calculations over visual flourish

This is the point where the tool can replace a paper-first or ad hoc workflow for the group.

## Phase 7 - Roster And Navigation

Goal: make many-character play manageable.

- search across characters
- recent-use views
- group characters by world
- filter by class, level range, world, status, tags, last played, and sessions played
- show the base character before its branch variants
- highlight commonly used or most-played versions

This phase matters because the product is not only for one hero in one campaign. It is for a personal library of protagonists.

## Phase 8 - History And Comparison

Goal: help players understand how a character changed over time.

- branch history views with games and sessions in chronological order
- infer chronology where possible from level progression
- allow manual ordering when chronology is ambiguous
- show diffs between levels and versions
- make it easy to answer "what changed from level 4 to level 5?"
- optional notes on branches, games, or versions

This phase deepens the product's identity, but it should not block the core create-plan-play-print loop.

## Likely v1.0 Boundary

The first version should include the minimum needed to become a real primary tool for the group.

- character creation
- authentication and user ownership guardrails for character data
- progression planning to level `N`
- multiclass-aware calculations
- branching from earlier levels
- world and game creation
- frozen game snapshots
- printable/exportable 4-page sheet
- basic roster search and filtering
- i18n foundation support (locale resolution, persisted preference, and fallback for `en`/`es`)

If needed, `v1.0` should favor reliability and scope control over extra polish.

## Likely v1.1 Follow-Up

These are strong candidates for the first post-release improvement cycle.

- version diffs
- richer branch history views
- better chronology controls
- more polished roster browsing
- translation polish for broader UI coverage beyond the v1 i18n foundation
- better spell browsing and reference ergonomics
- stronger inventory and loot handling
- expanded support for additional commonly used source material

## Later / v2 Direction

These are intentionally later so the project does not drift too early.

- sharing characters with other players or a DM
- DM read-only visibility into player characters
- private notes vs shared information
- broader shared-world browsing across users
- richer session tracking and in-session state changes
- deeper world continuity tools
- homebrew authoring tools for custom classes, subclasses, spells, items, or rules

## Explicit Non-Goals For Early Versions

- campaign management as the primary product surface
- collaborative editing
- branch merging
- full VTT-style play support
- deep narrative journaling before the character loop is solid
- broad homebrew authoring in the first usable release

## Cut-First Rule

If scope grows too large, cut in this order:

1. timeline polish and advanced history views
2. rich diffs and comparison UX
3. advanced roster analytics
4. deeper inventory management
5. world continuity features beyond grouping and context

Do not cut the core promise first: branching character progression with playable, printable outputs.

## Related Docs

- `README.md`
- `docs/README.md`
- `docs/architecture/app-architecture.md`
- `docs/architecture/data-sources.md`
- `docs/architecture/feature-workflow.md`
- `docs/features/authentication-and-identity-foundation.md`
- `docs/features/internationalization.md`
- `docs/specs/internationalization/foundation.md`
- `docs/architecture/internationalization.md`
- `docs/STATUS.md`
