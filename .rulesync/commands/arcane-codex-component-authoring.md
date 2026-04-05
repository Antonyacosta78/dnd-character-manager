---
description: "Apply Arcane Codex component-authoring governance"
targets: ["*"]
---

target_scope = $ARGUMENTS

If `target_scope` is empty, infer scope from the active task and recently touched files.

Execute this workflow:

1. Load skill `arcane-codex-component-authoring`.
2. Read:
   - `docs/architecture/design-system-decision-record.md`
   - `docs/specs/design-system/foundation.md`
   - `docs/specs/design-system/implementation-plan.md`
3. Inspect related components in `src/components/**` and route-local candidates in `src/app/**`.
4. Produce a concise governance report with:
   - `Decision`
   - `Placement`
   - `Pass`
   - `Violations`
   - `Required Fixes`
   - `Suggested Improvements`
5. If implementation is requested, apply required fixes first, then optional improvements.

Minimum checks:

- component creation gate (reuse first, justify new component)
- correct layer placement (`ui` vs `domain` vs `patterns` vs route-local)
- API quality (typed props, composition-first, limited flags)
- state completeness and non-color-only signaling
- keyboard/focus/escape and reduced-motion behavior where relevant
- token/i18n contract alignment
