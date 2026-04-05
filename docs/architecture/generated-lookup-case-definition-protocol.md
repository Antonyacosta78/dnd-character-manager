# Architecture: Generated Lookup Case Definition Protocol

## Purpose

Define a shared protocol for adding or updating semantic parity cases when generated lookup shapes change.

This note exists to prevent:

- strict-mode failures caused by representation-only differences
- silent option-loss regressions when new lookup shapes appear
- ad hoc one-off handling that drifts across parser iterations
- unclear ownership of what is semantic-critical vs decorative metadata

## Current Plan

### Scope

This protocol applies to semantic parity checks for generated lookup validation in import domain validation.

Primary lookup families in scope:

- subclass lookup parity
- spell-source lookup parity

### Semantic criticality tiers

Each new shape must be classified before implementation.

1. Availability-critical
   - Changes option availability decisions.
   - Must be part of strict semantic comparison.

2. Lineage-critical
   - Does not necessarily change availability, but changes lineage/provenance semantics required by product behavior.
   - Must be part of strict semantic comparison when lineage is feature-relevant.

3. Decorative/non-critical
   - Informational metadata with no current effect on option availability or required lineage behavior.
   - Excluded from strict blocking checks; may be included in debug diff output.

### New case definition workflow

1. Detect
   - Semantic projector/comparator identifies unknown grant family/key/shape.
   - Emit structured mismatch diagnostics with bounded samples.

2. Classify
   - Assign tier: availability-critical, lineage-critical, or decorative.
   - Record rationale.

3. Decide strictness
   - Availability/lineage unknowns fail closed in `strict` until modeled.
   - Decorative unknowns remain non-blocking.

4. Model
   - Add canonical semantic projection for the new shape.
   - Update edge-key normalization and lineage extraction rules as needed.

5. Test
   - Add fixture for minimal real shape.
   - Add positive semantic-equivalence tests.
   - Add negative mismatch tests.

6. Document
   - Update parity docs/spec notes with new case family and classification.
   - Add changelog note in affected docs.

7. Re-verify
   - Re-run strict and warn imports.
   - Confirm expected mismatch behavior and diagnostics quality.

### Mode behavior

- `strict`
  - Fail on semantic mismatches and unmodeled semantic-critical cases.
- `warn`
  - Surface semantic mismatches as warnings.
- `off`
  - Skip generated parity checks per integrity-mode policy.

### Diagnostics requirements

Parity diagnostics must include enough context for triage without requiring full raw diff payloads.

Minimum details:

- comparison mode (`semantic`)
- mismatch category (`missing`, `extra`, `lineage`, `unmodeled_case`)
- grant family/type
- bounded sample paths/keys
- recommended next action (`classify`, `model`, or `debug_only`)

Structural diff output may be included as optional debug diagnostics, but must not be the default strict pass/fail gate.

### Resolved decisions

- Classification source of truth uses a dedicated code-owned registry file (manifest) in the repository.
  - Docs and tests remain required, but the registry is authoritative for execution and tooling checks.
- Unmodeled semantic-critical cases use a dedicated reason code in addition to generic mismatch reporting.
  - Purpose: separate schema-evolution work from standard parity mismatches for triage and automation.

## Boundaries

This architecture note governs:

- how new generated lookup parity cases are introduced and validated
- strictness policy for unknown shapes in parity comparison

This architecture note does not govern:

- parser source resolution semantics (`_copy`, UID resolution, `additionalSpells` parsing)
- runtime query adapter implementation details
- API/CLI transport envelope formats

## Notes

- The protocol assumes semantic parity is the source of truth for strict mismatch decisions.
- Exact structural parity remains useful for debugging, but is intentionally secondary.
- Classifications can evolve; when product behavior starts depending on a previously decorative field, reclassify it and add strict tests.
- Keep this process lightweight: one clearly scoped parity case update per pull request when possible.

## Related Specs

- `docs/specs/foundation/option-complete-data-source-parsing.md`
- `docs/specs/foundation/catalog-publish-and-rules-catalog-interface.md`
- `docs/specs/foundation/catalog-publish-and-rules-catalog-interface-implementation-plan.md`

## Related Features

- Placeholder: `docs/features/foundation.md`
- Affected future features: character creation, progression planning, spell option selection

## Open Questions

- None for this protocol version.
