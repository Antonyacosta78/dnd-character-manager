# Prompt: Resolve Open Questions for Catalog Publish and RulesCatalog Interface

Use this prompt with another coding/planning agent to drive structured decisions with the user.

---

You are helping finalize foundation decisions for catalog publish and runtime `RulesCatalog` interfacing.

## Context to read first

1. `docs/specs/foundation/catalog-publish-and-rules-catalog-interface.md`
2. `docs/specs/foundation/catalog-publish-and-rules-catalog-interface-implementation-plan.md`
3. `docs/architecture/catalog-storage-and-read-model.md`
4. `docs/architecture/rules-catalog-provider.md`
5. `docs/architecture/catalog-lineage-and-import-runs.md`

## Your goal

Collect user decisions for unresolved questions and produce final decision statements that can be copied into docs as resolved decisions.

## Operating rules

- Keep terms consistent with this repository:
  - use "Data Source"
  - use `EXTERNAL_DATA_PATH` for path-root references
- Do not propose runtime reads directly from external source files.
- Keep decisions foundation-scoped (avoid speculative v2 expansion).
- Separate answers into **blocking** vs **non-blocking**.

## Questions to ask the user

### Blocking decisions

1. Publish write strategy per catalog version:
   - `replace` (delete existing runtime rows for version, then insert)
   - `upsert` (diff/upsert by unique keys)
   - hybrid strategy

2. Transaction boundary strategy:
   - publish row writes + activation in one transaction
   - publish commit then separate activation transaction
   - guarded two-phase approach

3. Payload size policy for canonical row `payloadJson`:
   - maximum allowed size per row
   - handling behavior on overflow (fail closed, split, or degrade)

### Non-blocking decisions

4. Optional artifact snapshots:
   - keep DB-only in v1
   - add optional immutable JSON artifacts per catalog version

5. Search/read performance posture in v1:
   - baseline indexed queries only
   - add precomputed searchable text columns now

6. Reader cache policy in v1:
   - DB reads only
   - in-memory fingerprint-scoped cache

## Required output format

Return exactly these sections:

1. `Resolved Blocking Decisions`
   - bullet list with final decision + rationale + impact on implementation

2. `Resolved Non-Blocking Decisions`
   - bullet list with final decision + rationale

3. `Doc Patch Suggestions`
   - file-by-file bullets indicating which lines/sections should be updated

4. `Implementation Impact`
   - concrete list of files/modules most affected by each blocking decision

5. `Risk Notes`
   - top risks if decisions are delayed or reversed later

## Decision defaults to suggest (if user asks for recommendation)

- Publish strategy: `replace` per catalog version (simpler correctness in foundation)
- Transaction boundary: one transaction for publish + activation only if row volume remains safe; otherwise guarded two-phase with activation contingent on publish success marker
- Payload size: fail-closed with explicit error and diagnostics; do not silently truncate
- Artifacts: optional and disabled by default in v1
- Search posture: baseline indexed queries first
- Cache policy: no cache first, add cache after baseline latency data

---

End of prompt.
