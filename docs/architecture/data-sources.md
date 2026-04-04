# Architecture: Data Sources

## Purpose

This document defines the data-source model for rules content, including trust boundaries, provenance requirements, and operational policies for syncing and consuming external datasets.

It exists to prevent two common failure modes:

1. Runtime code accidentally depending on external-format details.
2. Silent desynchronization between canonical source input and runtime-accessible catalog data.

## Source Taxonomy

### Canonical Source-of-Input

Primary location:

- path configured by `EXTERNAL_DATA_PATH` in local `.env`

Path convention:

- path references in this document are relative to `EXTERNAL_DATA_PATH`
- no fixed repository path is assumed

Characteristics:

- Gitignored local dataset.
- Manually synced by developers.
- May be edited manually for experiments.
- Never mutated by application runtime code.

Scope coverage (incremental):

- classes/subclasses
- spells
- races
- backgrounds
- feats
- optional features
- character creation options
- rewards
- additional Data Source entities as feature coverage expands

### Runtime Rule Access Source

Runtime code never reads raw files directly. Runtime rule reads go through the `RulesCatalog` contract, which is bound to a provider implementation at composition time.

Default v1 provider:

- `DerivedRulesCatalog` (compiled/normalized runtime dataset)

Planned future provider:

- `RawRulesCatalog` (runtime resolver over external source input)

The canonical source-of-input remains the same regardless of provider.

## Trust and Integrity Model

### Why integrity is separate from runtime format

Integrity answers "are these bytes exactly what we expect?".
Runtime suitability answers "can this be used safely and efficiently in our app request path?".

Both are required and intentionally separate.

### Dataset Fingerprint Requirements

A deterministic fingerprint must be computed from the source input set used for import.

Fingerprint inputs:

- relative file path
- file content hash
- deterministic ordering of files and hash aggregation

Fingerprint goals:

- reproducibility across machines
- tamper/corruption detection
- unambiguous lineage linkage to imported catalog versions

### Integrity Modes

`DATA_INTEGRITY_MODE` controls mismatch handling:

- `strict`
  - hard failure on fingerprint/lineage mismatch
  - expected in CI and production-like environments
- `warn`
  - continue with warnings and degraded trust flag
  - useful for local iterative development
- `off`
  - bypass checks for controlled experiments only

## Lineage and Provenance Requirements

Every published runtime catalog version must carry provenance metadata:

- source dataset fingerprint
- source label/version metadata (if available)
- importer/normalizer version identifier
- generation timestamp
- activation status

No runtime catalog version may be activated without complete provenance.

## Manual Editing Policy

Manual edits are allowed by design, but they are treated as source changes with full regeneration implications.

Required sequence after manual edits:

1. recompute fingerprint
2. rerun ingest/normalize/validate pipeline
3. publish new catalog version
4. activate only after validation passes

There is no "hot edit" path that bypasses lineage.

## Source Admission and Expansion Policy

When adding new external content categories, the following must be provided:

- parser mapping coverage
- normalization contract updates
- validation rules for required fields and references
- test fixtures for new content category
- explicit mention in relevant architecture/spec docs

This prevents silent expansion of implicit scope.

## Operational Practices

Recommended command model (exact script names may vary):

- `data:sync` - acquire/extract expected external dataset
- `data:fingerprint` - compute and print deterministic dataset hash
- `data:validate` - run source-level checks (optionally includes external schema toolkit checks)
- `data:import` - parse, resolve, normalize, validate, publish

These commands are separable so failures are diagnosable by stage.

## Anti-Patterns

The following are explicitly prohibited:

- reading files under `EXTERNAL_DATA_PATH` directly from UI or request handlers
- writing to `external/` from runtime code
- activating new catalog data without recorded fingerprint lineage
- mixing source-format fields directly into domain/application types

## Related Docs

- `docs/architecture/parsing-pipeline.md`
- `docs/architecture/rules-catalog-provider.md`
- `docs/architecture/catalog-lineage-and-import-runs.md`
- `docs/architecture/app-architecture.md`
