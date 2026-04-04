# Architecture: Catalog Storage and Read Model

## Purpose

Define how normalized import output becomes runtime-queryable catalog data, and set shared storage/read-model rules that keep parser correctness and runtime behavior aligned.

This decision prevents:

- runtime dependence on external source files
- divergence between published catalog lineage and runtime readers
- repeated per-request normalization or JSON-shape re-interpretation
- accidental coupling between app use-cases and import internals

## Decision Metadata

- Status: proposed
- Date: 2026-04-04
- Owner: foundation architecture
- Scope: publish stage + `DerivedRulesCatalog` runtime readers

## Current Plan

### Scope

This architecture note governs:

- runtime storage model for published catalog data
- read-model interface behavior for `DerivedRulesCatalog`
- publish/activation transactional guarantees

### Storage decision

Use a hybrid relational model in the application database (SQLite now, Postgres-compatible schema style):

1. Canonical entity table for normalized payloads.
2. Typed relation/projection tables for high-value graph/query paths.

v1 baseline tables to add alongside lineage tables:

- `catalog_entities` (canonical)
- `catalog_feature_references` (owner -> feature)
- `catalog_spell_source_edges` (spell availability graph)

Rationale:

- Canonical table provides flexibility for evolving Data Source shapes.
- Relation tables provide predictable runtime query performance and integrity checks.
- Avoids both extremes:
  - single "JSON blob only" table that is hard to query safely
  - fully split per-entity persistence schema too early in foundation scope

### Publish behavior rules

- Publish writes are version-scoped (`catalog_version_id` required on all runtime rows).
- Publish is fail-closed: if row writes fail, publish fails.
- Activation is explicit and atomic with activation-event recording.
- Runtime reads are active-version scoped only.

### Runtime read model rules

`DerivedRulesCatalog` readers must:

- resolve active catalog version before serving requests
- return deterministic, typed payloads for a fixed active fingerprint
- return `null` for not-found `get` calls
- avoid direct reads from external source paths

Namespaces covered in v1 publish/read-model slice:

- classes
- subclasses
- races
- backgrounds
- spells
- feats
- features

### Error/failure semantics

- no active catalog version: operational unavailable error category
- data integrity mismatch: behavior follows `DATA_INTEGRITY_MODE`
- read-model contract violation (malformed runtime row): adapter-level contract violation error

## Boundaries

This note governs:

- storage/read-model contracts used across multiple features
- publish/activation behavior shared across import and runtime paths

This note does not govern:

- detailed parser semantics for `_copy`, references, and `additionalSpells` (see parser specs/notes)
- UI route payload formatting
- feature-level endpoint design

## Compatibility and Migration

Current state:

- lineage tables exist
- parser pipeline produces normalized data
- publish stage does not yet persist runtime catalog rows

Migration approach:

1. add runtime catalog tables and repository ports
2. implement publish transaction writing canonical + relation rows
3. implement `DerivedRulesCatalog` readers from runtime rows
4. switch runtime reads to published storage path

Backout:

- keep active pointer unchanged on publish failure
- roll back by activating previous version via activation protocol

## Contract Appendix

Illustrative runtime row contracts:

```ts
interface CatalogEntityRow {
  catalogVersionId: string;
  kind:
    | "class"
    | "subclass"
    | "classFeature"
    | "subclassFeature"
    | "spell"
    | "race"
    | "background"
    | "feat"
    | "optionalfeature"
    | "charoption"
    | "reward";
  identity: string;
  name: string;
  source: string;
  edition?: string;
  payloadJson: string;
}

interface CatalogSpellSourceEdgeRow {
  catalogVersionId: string;
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
  ownerClassName?: string;
  ownerClassSource?: string;
  ownerSubclassShortName?: string;
  definedInSource?: string;
}
```

## Error Taxonomy

Expected adapter/repository errors (mapped to existing envelopes):

- `RulesCatalogUnavailableError`
- `RulesCatalogDatasetMismatchError`
- `RulesCatalogContractViolationError`
- `PersistenceError`

Mapping requirement:

- keep existing API/CLI envelope shapes from `docs/architecture/api-error-contract.md`
- no transport-envelope redesign in this slice

## Verification Expectations

Minimum required before adoption:

- publish idempotency tests for same fingerprint/importer version
- activation atomicity tests (no partial pointer writes)
- `DerivedRulesCatalog` contract tests against published rows
- read tests for each v1 namespace with active-version scoping
- failure tests for missing active version and malformed payload rows

## Notes

- SQLite remains the primary runtime store in v1 foundation.
- Optional JSON artifact snapshots are allowed as secondary diagnostics, not primary runtime source.
- Keep runtime query logic in adapters/repositories; app layer consumes only ports.

## Related Specs

- `docs/specs/foundation/catalog-publish-and-rules-catalog-interface.md`
- `docs/specs/foundation/catalog-publish-and-rules-catalog-interface-implementation-plan.md`
- `docs/specs/foundation/option-complete-data-source-parsing.md`

## Related Features

- Placeholder: `docs/features/foundation.md`
- Affected future features: character creation, progression planning, spell option selection

## Open Questions

- Should canonical entity rows be physically partitioned by kind in v1 (separate tables), or remain one table with compound indexes until read pressure proves otherwise?
- Should publish write an optional immutable artifact file bundle for each catalog version in addition to DB rows?
