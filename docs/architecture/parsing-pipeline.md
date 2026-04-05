# Architecture: Parsing Pipeline

## Metadata

- Status: `in-progress`
- Created At: `2026-03-18`
- Last Updated: `2026-04-04`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-04` - `Antony Acosta` - Tuned status to reflect active implementation progress. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Backfilled metadata and changelog sections for lifecycle tracking. (Made with OpenCode)
- `2026-03-18` - `Antony Acosta` - Initial document created.

## Purpose

This document specifies the ingestion pipeline from external Data Source input to runtime-usable rules catalog data. It defines stage contracts, artifacts, idempotency behavior, and failure semantics so implementation can be automated without guessing.

Path convention:

- Source root is read from `EXTERNAL_DATA_PATH` in local `.env`.
- Path examples in this document are relative to `EXTERNAL_DATA_PATH`.

## Pipeline Contract

Pipeline objective:

- Convert external source input into validated, publishable runtime catalog versions.
- Preserve full lineage from published output to input fingerprint.
- Keep all heavy transformation work out of runtime request paths.

Pipeline must be:

- deterministic for the same inputs and importer version
- stage-observable with actionable diagnostics
- fail-safe (no partial activation)
- replayable in local and CI environments

## High-Level Stages

1. Source sync and manifest capture
2. Deterministic fingerprint computation
3. Source-level validation gate
4. Parse and structural resolution
5. Semantic normalization to internal contracts
6. Domain and referential validation
7. Publish and activate catalog version

## Stage Details

### Stage 1: Source Sync and Manifest Capture

Inputs:

- expected external dataset reference (archive/version/ref)

Actions:

- ensure source files are present under configured `EXTERNAL_DATA_PATH`
- capture sync metadata (timestamp, source ref, extraction details)

Outputs:

- local source tree ready for processing
- manifest metadata artifact for run audit

Failure modes:

- missing archive/source
- extraction errors
- path layout mismatch

### Stage 2: Deterministic Fingerprint

Inputs:

- source file tree from Stage 1

Actions:

- enumerate included files with deterministic ordering
- hash each file content
- hash canonical `(relativePath, fileHash)` sequence into dataset fingerprint

Outputs:

- dataset fingerprint
- optional per-file hash manifest for debugging diff causes

Design requirement:

- same dataset bytes must produce same fingerprint across machines.

### Stage 3: Source Validation Gate

Inputs:

- source file tree
- optional schema validators/tooling

Actions:

- run structural checks on expected files and index references
- optionally run external schema/file checks for early hygiene enforcement

Outputs:

- pass/fail result with diagnostics grouped by file and rule

Policy:

- strict environments fail immediately on validation errors.

### Stage 4: Parse and Resolve

Inputs:

- validated raw source JSON

Actions:

- read index-driven datasets (example: class/spell subfiles) and root datasets (for example races/backgrounds/feats/optional features)
- resolve source mechanics (`_copy`, `_mod`, and related merge semantics)
- resolve in-dataset references where required for downstream normalization
- evaluate `additionalSpells` filter expressions with full v1 semantics
- process tagged text where needed for runtime readability/searching

Outputs:

- resolved intermediate entities with explicit source provenance

Implementation note:

- this stage owns format semantics; those semantics must not leak above this boundary.

### Stage 5: Normalize

Inputs:

- resolved intermediate entities

Actions:

- map entities to internal canonical contracts (`ClassDefinition`, `SpellDefinition`, etc.)
- shape data for runtime query efficiency and stability
- annotate normalized records with source identity metadata

Outputs:

- normalized entity sets partitioned by type

Design requirement:

- normalization is explicit, versioned, and testable.

### Stage 6: Domain and Referential Validation

Inputs:

- normalized entity sets

Actions:

- validate required fields and type-level constraints
- validate cross-entity references (for example subclass -> class, spell references, and spell grants from feat/optional feature/background/race/reward/subclass sources)
- validate uniqueness and key stability assumptions

Outputs:

- validation report
- publishable normalized package on success

Policy:

- validation failures block publish.
- generated-lookup parity mismatch handling follows `DATA_INTEGRITY_MODE` policy.

### Stage 7: Publish and Activate

Inputs:

- publishable normalized package
- dataset fingerprint
- run metadata

Actions:

- write normalized artifacts into runtime catalog storage
- register catalog version and lineage metadata
- activate new catalog version atomically

Outputs:

- active catalog version bound to explicit source fingerprint

Atomicity requirement:

- no partial activation; either entire catalog version activates or none of it does.

## Idempotency and Replay Semantics

Expected behavior:

- same source fingerprint + same importer version should produce equivalent normalized output.
- re-running publish for an existing identical fingerprint should be a no-op or produce an equivalent inactive duplicate based on policy.

Recommended policy:

- enforce uniqueness on `(fingerprint, importerVersion)` at catalog version level.

## Runtime Separation and Triggering

The pipeline is not a request-path operation.

- Triggered via explicit command/job (`data:import`, CI task, admin operation).
- Runtime app code consumes `RulesCatalog` only.
- Runtime should never parse source files directly as a side effect of user requests.

## Artifacts and Records

Minimum artifacts per pipeline run:

- run id
- source manifest metadata
- dataset fingerprint
- validation reports (source-level and normalized-level)
- catalog version id (if publish succeeds)
- activation status

These artifacts are required for diagnostics and rollback confidence.

## Failure Handling Policy

Failure classes:

- source acquisition failures
- fingerprint mismatch/integrity failures
- schema/structural validation failures
- parse/resolve failures
- normalization/validation failures
- publish/activation failures

Handling rules:

- fail fast on stage failure, preserve diagnostics
- do not activate partially produced outputs
- in strict mode, integrity mismatch blocks runtime activation paths

## Testing Strategy for Pipeline

Required test categories:

- fixture tests for `_copy`/`_mod` resolution semantics
- normalization contract tests
- referential integrity tests across entity types
- spell-option expansion tests across `additionalSpells` contributors (including feats and optional features)
- replay/idempotency tests by fingerprint
- activation atomicity tests

## Implementation Guidance

Suggested module layout:

- `src/server/import/sync/*`
- `src/server/import/fingerprint/*`
- `src/server/import/validate-source/*`
- `src/server/import/resolve/*`
- `src/server/import/normalize/*`
- `src/server/import/validate-domain/*`
- `src/server/import/publish/*`

This is guidance, not a hard requirement; equivalent structure is acceptable if boundaries are preserved.

## Related Docs

- `docs/architecture/data-sources.md`
- `docs/architecture/rules-catalog-provider.md`
- `docs/architecture/catalog-lineage-and-import-runs.md`
- `docs/architecture/app-architecture.md`
- `docs/architecture/parser-option-completeness.md`
- `docs/architecture/generated-lookup-case-definition-protocol.md`
- `docs/specs/parsing/option-complete-data-source-parsing.md`
