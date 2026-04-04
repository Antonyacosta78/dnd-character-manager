# Architecture: Parser Option Completeness Policy

## Purpose

Define the shared parser policy that prevents silent option loss when importing Data Source content.

This note exists to prevent:

- false negatives in future character decisions (missing valid class/spell/feature options)
- drift between parser behavior and upstream Data Source resolution semantics
- feature teams implementing partial parser logic that appears to work but silently drops options
- inconsistent failure handling for option-critical parsing gaps

## Decision Metadata

- Status: proposed
- Date: 2026-04-04
- Decision owner: foundation architecture
- Scope: import pipeline stages `validate_source`, `resolve`, `normalize`, `validate_domain`
- Primary audience: senior developers and AI coding agents implementing import/parser flows

## Current Plan

### Scope

This policy governs parser completeness rules that impact option availability across multiple features.

It applies to:

- foundation import pipeline implementation
- normalized catalog publication behavior
- downstream character-option read models that depend on imported data

### Core policy

The system prioritizes option completeness over permissive partial imports.

Policy rule:

- If option completeness cannot be guaranteed, import fails.

Corollary:

- No silent skipping of unsupported reference shapes, `_meta` directives, `_copy` structures, or additional-spell derivation paths.

### Data path convention

- Parser source root must be read from `EXTERNAL_DATA_PATH` in local `.env`.
- Path examples in related docs are relative to `EXTERNAL_DATA_PATH`.
- Do not couple parser behavior to one fixed repository path.

### Non-negotiable parser contracts

Mandatory contracts:

- Resolve `_meta.dependencies`, `_meta.includes`, `_meta.otherSources`, `_meta.internalCopies`.
- Resolve recursive `_copy` behavior including `_mod` and `_preserve` semantics.
- Parse class/subclass feature UIDs using Data Source-compatible formats and source defaults.
- Fully dereference class/subclass feature references from string and object forms.
- Reconstruct spell-source availability from both direct spell-source lists and `additionalSpells` contributions.
- Preserve provenance required for disambiguation and lineage (`source`, `edition`, `reprintedAs`, `otherSources`, `definedInSource`).
- Validate generated lookup parity when lookup files are present.

### Spell-source parity rule

Spell-source reconstruction must include option grants from:

- subclass
- background
- charoption
- feat
- optionalfeature
- race
- reward

Supported `additionalSpells` forms are mandatory:

- direct UID entries
- `choose.from`
- `choose` filter expressions
- `all` filter expressions
- addition types: `innate`, `known`, `prepared`, `expanded`

### Generated-file rule

Generated files are not canonical source-of-truth, but they are mandatory consistency checks when present:

- `gendata-subclass-lookup.json`
- `gendata-spell-source-lookup.json`

Mismatch policy:

- mismatch in strict import contexts is a blocking error
- mismatch in non-strict local contexts may be warning-only only when explicitly configured by integrity mode

## Boundaries

This architecture note governs:

- parser completeness expectations and failure semantics
- option-integrity constraints for import and normalization

This architecture note does not govern:

- UI rendering of class/spell choices
- final transport shape for API/CLI envelopes (governed by `docs/architecture/api-error-contract.md`)
- full product behavior for progression and character planning

## Compatibility and Migration

Current state:

- import pipeline exists as a staged foundation skeleton
- parsing semantics are not fully implemented yet

Adoption strategy:

1. Implement mandatory resolver semantics first (`_meta`, `_copy`, UID parsing, dereference).
2. Implement full spell-source parity reconstruction.
3. Add generated-lookup parity checks.
4. Enforce strict failure behavior and surface contract-aligned diagnostics.

Backout strategy:

- If rollout causes widespread failures, disable publication path and keep active catalog unchanged.
- Do not relax parser contracts by silent skipping; any temporary downgrade must be explicit and documented.

## Contract Appendix

Representative internal contracts (names illustrative, final location defined in implementation plan):

```ts
interface ResolvedSpellSourceEdge {
  spellName: string;
  spellSource: string;
  grantType:
    | "class"
    | "classVariant"
    | "subclass"
    | "background"
    | "charoption"
    | "feat"
    | "optionalfeature"
    | "race"
    | "reward";
  ownerName: string;
  ownerSource: string;
  definedInSource?: string;
  definedInSources?: string[];
}

interface ParserCompletenessDiagnostics {
  unresolvedReferences: string[];
  unsupportedAdditionalSpellsShapes: string[];
  generatedLookupMismatches: string[];
  duplicateIdentityCollisions: string[];
}
```

Contract requirements:

- diagnostics must preserve enough identity detail to reproduce missing-option issues
- normalized output must preserve provenance fields needed for downstream option decisions

## Error Taxonomy

Internal parser reason codes (for stage diagnostics) should include at minimum:

- `PARSER_UNRESOLVED_REFERENCE`
- `PARSER_UNSUPPORTED_ADDITIONAL_SPELLS_SHAPE`
- `PARSER_META_DIRECTIVE_UNSUPPORTED`
- `PARSER_COPY_RESOLUTION_FAILED`
- `PARSER_GENERATED_LOOKUP_MISMATCH`
- `PARSER_IDENTITY_COLLISION`

Mapping rule:

- internal reasons are mapped to existing API/CLI contract error envelopes from `docs/architecture/api-error-contract.md`
- no new transport envelope shapes are introduced by parser work

## Verification Expectations

Minimum verification required before this policy is considered adopted in code:

- fixture tests for `_meta` and `_copy` behavior
- UID parse/hash compatibility tests for class/subclass features
- spell-source parity tests including all mandatory `additionalSpells` forms
- parity tests against generated lookups when those files exist
- negative tests proving fail-closed behavior on unresolved or unsupported option-critical inputs

## Notes

- This policy intentionally favors explicit failure over silent partial success when option integrity is at risk.
- Canonical input remains non-generated source files; generated files are consistency signals, not primary data.

## Related Specs

- `docs/specs/foundation/option-complete-data-source-parsing.md`
- `docs/specs/foundation/implementation-plan.md`

## Related Features

- Placeholder: `docs/features/foundation.md` (to be created)
- Affected future features: character creation, progression planning, and spell selection flows

## Open Questions

- Should generated-lookup mismatch behavior be configurable independently from `DATA_INTEGRITY_MODE`, or remain coupled in v1?
- Which minimum subset of filter-expression semantics is acceptable for first pass before full expression parity is required?
