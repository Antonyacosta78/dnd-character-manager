# Contributing

Thanks for helping improve the D&D Character Manager.

## Start Here

- Read the product context in `README.md`.
- Read coding standards in `.rulesync/rules/10-coding-standards.md`.
- Install dependencies with `bun install`.
- Run the app with `bun dev`.

## Working Style

- Keep changes small, focused, and easy to review.
- Match existing patterns in naming, file structure, and data flow.
- Verify code edits with `bun run lint` at minimum.

## Coding Standards (Quick Reference)

- Resolve trade-offs in this order: Correctness > Simplicity > Readability > Performance > Reuse.
- Follow KISS: choose simple solutions and break complex logic into smaller steps.
- Prefer composition over personalization: avoid APIs with many flags and optional behavior switches.
- Follow DRY with judgment: reuse code, but allow small repetition when it keeps code easier to understand.
- Use decision heuristics: Rule of 3 for abstractions, avoid multi-flag APIs, and split functions with too many optional parameters.
- AI agents should suggest refactors by default and execute them only when explicitly requested or approved.
- In React, keep state close to where it is used and optimize only after a proven render hotspot.

## AI Instruction Sync

- `.rulesync/` is the source of truth for shared AI instructions.
- Do not manually edit generated AI instruction outputs.
- After changing `.rulesync/`, run `bun run ai:generate` (or `bun run ai:generate:all` when needed).
- `AGENTS.md` is generated locally and ignored by git.
