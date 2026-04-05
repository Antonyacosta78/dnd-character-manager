---
description: "Audit and update roadmap implementation progress"
targets: ["*"]
---

command_args = $ARGUMENTS

Update implementation progress tracking for `docs/ROADMAP.md` and `docs/STATUS.md`.

Scope and defaults:

- Default scope: roadmap phases 0-7 using all `docs/**/*.md` and relevant implementation evidence.
- If `command_args` includes paths or globs, prioritize those areas when inferring affected phases.
- Audit-first by default. Only edit files when `--apply` is provided.

Execute this workflow:

1. Read:
   - `docs/ROADMAP.md`
   - `docs/STATUS.md` (create from current roadmap if missing)
   - related files in `docs/features/**`, `docs/specs/**`, `docs/architecture/**`
2. Inspect implementation evidence from `src/**`, `prisma/**`, and `scripts/**`.
3. Classify each roadmap phase using:
   - `completed`
   - `in-progress`
   - `planned`
   - `blocked`
   - `unknown`
4. Set confidence per phase (`high`, `medium`, `low`) based on evidence strength.
5. Produce an audit report with:
   - phase
   - current status
   - recommended status
   - evidence paths
   - unresolved gaps
6. If `--apply` is present:
   - update `docs/STATUS.md` statuses, checklist items, and evidence paths
   - update the implementation snapshot section in `docs/ROADMAP.md`
   - keep `Last verified` date current

Guardrails:

- Never claim `completed` without concrete implementation evidence.
- If evidence is mixed, prefer `in-progress` or `unknown` and explain why.
- Keep edits minimal and preserve existing roadmap intent text.

Output requirements:

- Start with a one-line summary of changed phases.
- Then list `High Confidence Updates`, `Needs Review`, and `No Change`.
- If no files were edited (no `--apply`), clearly state `audit only`.
