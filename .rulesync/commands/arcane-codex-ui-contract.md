---
description: "Apply Arcane Codex UI contract to current task or diff"
targets: ["*"]
---

target_scope = $ARGUMENTS

If `target_scope` is empty, infer scope from the active user request and recent changed files.

Execute this workflow:

1. Load the `arcane-codex-ui-contract` skill.
2. Read:
   - `docs/architecture/design-system-decision-record.md`
   - `docs/specs/design-system/implementation-plan.md`
3. Evaluate the task or diff against the contract.
4. Produce a concise compliance report with these sections:
   - `Pass`
   - `Violations`
   - `Required Fixes`
   - `Suggested Improvements`
5. If changes are requested in the prompt, implement them using the same contract.

Compliance checks must cover at minimum:

- token semantics (no ad hoc color literals in JSX/TSX)
- Arcane Codex visual consistency
- Workbench vs Codex surface appropriateness
- state completeness (loading/empty/error/invalid)
- focus visibility and keyboard flow
- reduced-motion handling
- domain emphasis clarity for stats/combat/branch/snapshot states
