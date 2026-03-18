---
name: quality-checks
description: >-
  Choose the smallest useful verification step for a change and report any
  remaining gaps instead of skipping validation silently.
---
# Quality Checks Skill

Use this skill after implementation work.

## Verification Ladder

1. run `bun run lint` after normal code edits
2. run `bun run build` when the change affects routing, metadata, or build-time behavior
3. if a command cannot be run, say why and tell the user what remains to verify

## Reporting

- mention the exact command you ran
- summarize failures with the file or area involved
- if verification was partial, say what confidence remains and what should be checked next
