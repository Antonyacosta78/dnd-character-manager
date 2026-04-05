---
root: false
targets: ["*"]
description: "Documentation metadata definitions and author attribution rules"
globs: ["docs/**/*.md"]
opencode:
  description: "Documentation metadata definitions and author attribution rules"
---

# Documentation Metadata

Use this contract for documentation metadata fields in `docs/architecture/`, `docs/features/`, `docs/specs/`, and `docs/templates/`.

## Field Definitions

- `Status`: Current lifecycle state of the document. Use the status values defined by the matching template.
- `Created At`: Date the document was first created (`YYYY-MM-DD`). Treat as immutable after initial set.
- `Last Updated`: Date of the latest meaningful content update (`YYYY-MM-DD`). Update this whenever the doc intent, scope, decisions, or status changes.
- `Owner`: Accountable human steward for document correctness and maintenance.
- `Changelog`: Append-only history of meaningful updates in this format: `YYYY-MM-DD - <author> - <what changed and why>`.

## Attribution Rules

- `Owner` and changelog `author` must be a person (or human team), never an AI/tool name.
- Use `git config user.name` as the default author source when adding metadata or changelog entries.
- Do not use tool labels such as `OpenCode`, `Cursor`, `Claude`, or `Copilot` as document authors/owners.
- If AI/tool assistance should be recorded, add it as an addendum in the changelog description, for example: `Made with <tool name>`.

## Maintenance Rules

- On first metadata backfill, set `Created At` from the earliest commit date for that file when available.
- Keep changelog entries concise and outcome-focused (what changed and why).
- Prefer one clear entry per meaningful update rather than many tiny noise entries.
