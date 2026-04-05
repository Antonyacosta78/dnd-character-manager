---
root: false
targets: ["*"]
description: "Keep roadmap progress docs aligned with implementation evidence"
globs: ["docs/**/*.md", "src/**/*", "prisma/**/*", "scripts/**/*"]
opencode:
  description: "Keep roadmap progress docs aligned with implementation evidence"
---

# Roadmap Progress Tracking

Use this rule to keep roadmap progress visible and evidence-backed.

## Source Of Truth

- `docs/ROADMAP.md` stays strategic and phase-oriented.
- `docs/STATUS.md` is the operational progress ledger with evidence.

## Trigger

Apply this rule when a change affects roadmap phase scope, including:

- `docs/features/**`
- `docs/specs/**`
- `docs/architecture/**`
- implementation code in `src/**`, `prisma/**`, or `scripts/**`

## Required Updates

When a roadmap-impacting change lands:

1. Update `docs/STATUS.md` for affected phases.
2. Keep the `docs/ROADMAP.md` implementation snapshot aligned.
3. Include concrete evidence paths for any status change.
4. Use conservative status values: `completed`, `in-progress`, `planned`, `blocked`, `unknown`.

## Evidence Standard

- Do not mark a phase `completed` from intent docs alone.
- Prefer wired implementation evidence (code paths, commands, tests, or runtime integration).
- If evidence is partial, use `in-progress` or `unknown` and list the remaining gap.

## Coordination With Metadata Rule

- For documents that carry metadata fields, follow `40-doc-metadata` for `Status`, `Last Updated`, and `Changelog` behavior.
- If a change is editorial only and does not affect phase progress, explicitly state `no roadmap progress impact` in the final update note.
