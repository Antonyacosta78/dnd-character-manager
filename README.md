# D&D Character Manager

A character-first Dungeons & Dragons 5e (2014) manager built for a specific friend group's play style.

This project is about tracking a character as a persistent identity across many possible versions of their life: the first idea, the build you planned, the version that actually got played, and the world-specific variants that grew from it. It is not a campaign manager. It is a tool for planning characters, branching them into alternate timelines, and producing accurate, playable sheets when it is time to sit at the table.

## Product Vision

The core thesis of the app is:

> Manage your D&D characters and their many timelines, from what you first envisioned to all the different versions you actually played.

In practical terms, that means:

- A character exists independently from any one campaign or world.
- A character has a main progression, but can branch into alternate versions.
- Branches are tied to a specific world once they split.
- You can plan a character from level 1 to a target level, while leaving future levels undefined until you need them.
- When a build is fully defined at a given level, the app can generate a playable version from it.
- When that character joins an actual game, the app creates a frozen snapshot for that game so the played record stays stable even if planning continues elsewhere.

The priority is gameplay readiness: accurate calculations, clear progression history, and a reliable path from concept to playable sheet.

## Core Concepts

### Character

A persistent identity: the hero, villain, or adventurer at the center of everything.

A character is not owned by a single campaign. It is the long-lived concept that can have multiple build paths and played versions over time.

### Branch

A progression timeline for a character.

A branch starts from the character's progression and can diverge into an alternate version. This can represent a different build choice, a different future, or a world-specific adaptation. Branches are world-locked once created.

### World

A shared setting or continuity that gives context to branches and games.

Worlds matter as grouping, history, and context. They help answer questions like which versions of a character belong to the same shared continuity.

### Game

A specific play instance, campaign, one-shot, or table where a character is used.

Games exist as the context where a playable version is actually brought to the table.

### Snapshot

A frozen playable record created for a specific game.

When a character joins a game, the app creates a snapshot from a chosen branch and level. That snapshot does not drift as future planning changes. It represents what was actually played in that game.

## v1 Scope

Version 1 focuses on the core loop of creating, planning, versioning, and playing characters:

- Character creation for D&D 5e (2014)
- Progression planning from level 1 to a target level
- Partially defined future levels, so planning can stay flexible
- Branching and alternate character versions
- World context for organizing branches and history
- Game records tied to frozen character snapshots
- Accurate calculations for playable character output
- PDF export of the standard 4-page playable character sheet
- Internationalization (i18n) foundation support: deterministic locale resolution, persisted preference, and fallback behavior for `en`/`es`

The initial product is single-user-first. It is meant to work well for one person managing their own characters and their own table history before any collaboration features are introduced.

## Non-Goals

The project is intentionally not trying to be all things to all tables.

For v1, it is not focused on:

- Campaign management
- Session notes, quest logs, or DM planning tools
- Shared editing or multi-user collaboration
- Broad marketplace-style support for every table's custom workflow
- Replacing a full virtual tabletop
- Solving every homebrew rule system out of the gate
- Full translation polish and copy QA for every feature surface at launch

See also:

- `docs/features/internationalization.md`
- `docs/specs/internationalization/foundation.md`
- `docs/architecture/internationalization.md`

## Local Development

This repository uses Bun for local development.

### Requirements

- [Bun](https://bun.sh/)
- Node.js-compatible local environment for Next.js development

### Getting Started

```bash
bun install
bun dev
```

Then open `http://localhost:3000`.

### Common Commands

```bash
bun dev
bun run build
bun run start
bun run lint
bun run ai:generate
bun run ai:generate:all
bun run ai:check
```

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Bun

## Coding Standards

- Canonical coding standards for humans and AI agents live in `.rulesync/rules/10-coding-standards.md`.
- Contributor-facing workflow guidance lives in `CONTRIBUTING.md`.
- When standards under `.rulesync/` change, run `bun run ai:generate` so generated agent/tool instructions stay in sync.
- `AGENTS.md` is generated locally and ignored by git.

## Notes

This repository reflects a specific product direction:

- D&D 5e 2014 rules focus
- Character-first design
- World-aware branching and version history
- Playable output over campaign tooling
- Single-user-first scope for v1

If you are working in the codebase, keep that framing in mind. New features should support the core character planning and gameplay-readiness loop rather than drift into campaign management.
