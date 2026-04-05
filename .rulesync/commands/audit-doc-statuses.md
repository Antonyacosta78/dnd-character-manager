---
description: "Audit docs status metadata against repository reality"
targets: ["*"]
---

command_args = $ARGUMENTS

Run a documentation status audit for files under `docs/`.

Scope and defaults:

- Default scope: all `docs/**/*.md` except `docs/templates/**`.
- If `command_args` contains paths or glob patterns, limit the audit to those targets.
- If `command_args` contains `--include-templates`, include `docs/templates/**` in the audit.
- This command is audit-first: do not edit files unless `--apply` is explicitly provided.

Execute this workflow:

1. Discover candidate docs and collect metadata:
   - Read each file and extract `Status`, `Last Updated`, and `Changelog` entries.
2. Infer reality from the repository:
   - Inspect relevant code, tests, scripts, and runtime wiring that correspond to each doc's scope.
   - Prefer concrete evidence (implemented files, passing tests, TODO markers, placeholder text, unwired commands).
3. Compare `Status` to reality and classify confidence:
   - `aligned`
   - `likely-misaligned`
   - `uncertain`
4. Produce an audit report grouped by certainty:
   - `Mismatches (High Confidence)`
   - `Mismatches (Needs Review)`
   - `Aligned`

For each mismatched file include:

- file path
- declared status
- recommended status
- evidence bullets with file references
- whether changelog should be updated

Status interpretation guidance:

- `proposed`/`draft`: planning exists, implementation not started
- `in-progress`: partial implementation or active unfinished slice
- `approved`/`accepted`: decision/spec is locked and being used as contract
- `completed`: implementation for the documented slice is done and wired
- `blocked`/`deprecated`/`superseded`/`cancelled`: only when explicit repository evidence supports it

Changelog policy checks:

- Validate changelog order is most recent -> oldest.
- If `--apply` is provided, update mismatched statuses and append a newest-first changelog entry describing the correction.
- Preserve existing author/date style in the touched file.

Output format requirements:

- Start with a one-line audit summary: scanned files, mismatches, uncertain.
- Then list high-confidence mismatches first.
- Keep recommendations actionable and minimal; avoid speculative rewrites.
