# Architecture: Catalog Storage and Read Model

## Purpose

Define how normalized import output becomes runtime-queryable catalog data, and set shared storage/read-model rules that keep parser correctness and runtime behavior aligned.

This decision prevents:

- runtime dependence on external source files
- divergence between published catalog lineage and runtime readers
- repeated per-request normalization or JSON-shape re-interpretation
- accidental coupling between app use-cases and import internals

## Metadata

- Status: `in-progress`
- Created At: `2026-04-04`
- Last Updated: `2026-04-04`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-04` - `Antony Acosta` - Created architecture note for catalog storage/read-model boundaries.
- `2026-04-04` - `Antony Acosta` - Resolved publish strategy, transaction boundary, payload size policy, and v1 runtime read posture decisions. Made with OpenCode.
- `2026-04-04` - `Antony Acosta` - Finalized v1 canonical row layout decision to keep one canonical table with compound indexes. Made with OpenCode.
- `2026-04-04` - `Antony Acosta` - Updated current-state note to reflect implemented publish persistence and guarded activation state. Made with OpenCode.

## Decision Scope

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
- Publish row writes use `replace` semantics per catalog version (`delete + insert` for version-scoped runtime rows).
- Publish and activation use a guarded two-phase boundary (publish commit first, guarded activation commit second).
- Canonical `payloadJson` rows are capped at `2MB` (UTF-8 bytes) with fail-closed overflow behavior and explicit diagnostics.
- Publish is fail-closed: if row writes fail, publish fails.
- Activation is explicit and atomic with activation-event recording.
- Runtime reads are active-version scoped only.

### Runtime read model rules

`DerivedRulesCatalog` readers must:

- resolve active catalog version before serving requests
- return deterministic, typed payloads for a fixed active fingerprint
- return `null` for not-found `get` calls
- avoid direct reads from external source paths
- use baseline indexed queries in v1 (no precomputed searchable text columns in this slice)
- support fingerprint-scoped in-memory caching with required invalidation on active fingerprint change

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
- publish stage persists runtime catalog rows and guarded activation state

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
- Optional JSON artifact snapshots are allowed as secondary diagnostics, disabled by default in v1, and never the primary runtime source.
- Keep runtime query logic in adapters/repositories; app layer consumes only ports.

## Resolved Decisions (2026-04-04)

- Publish write strategy is `replace` per catalog version.
- Publish/activation transaction boundary is guarded two-phase.
- Canonical `payloadJson` size policy is `2MB` max per row with fail-closed overflow handling.
- Immutable JSON artifact snapshots are optional and disabled by default.
- Search/read posture is baseline indexed queries only in v1.
- Reader cache policy is fingerprint-scoped in-memory cache with strict fingerprint-change invalidation.
- Canonical entity rows stay in one table with compound indexes in v1; physical partitioning by kind is deferred until measured read pressure justifies it.

## Related Specs

- `docs/specs/rules-catalog/catalog-publish-and-rules-catalog-interface.md`
- `docs/specs/rules-catalog/catalog-publish-and-rules-catalog-interface-implementation-plan.md`
- `docs/specs/parsing/option-complete-data-source-parsing.md`

## Related Features

- Placeholder: `docs/features/foundation.md`
- Affected future features: character creation, progression planning, spell option selection

