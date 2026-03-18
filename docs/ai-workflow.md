# AI Workflow

This repository uses Rulesync so the canonical AI instructions stay portable.

## Layout

- `rulesync.jsonc` defines which tool outputs get generated.
- `.rulesync/rules/` holds shared project rules.
- `.rulesync/subagents/` holds portable subagent definitions.
- `.rulesync/skills/` holds directory-based skills that can include extra files later.
- `.rulesync/.aiignore` is ready for targets that support ignore-file generation.

## Default Workflow

1. Edit or add files under `.rulesync/`.
2. Run `bun run ai:generate` to refresh OpenCode outputs.
3. Commit both the canonical files and the generated outputs you want teammates to use.

## Multi-Tool Workflow

If you want to generate for more than OpenCode, run `bun run ai:generate:all`.

That keeps `.rulesync/` as the source of truth while letting other tools consume generated files.

## Checks

- `bun run ai:check` verifies generated files are up to date.
- `bun run lint` verifies the app code after changes that touch the product.
