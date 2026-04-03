# Architecture: Catalog Lineage and Import Runs

## Purpose

This document defines the persistence model for rules-catalog provenance, import execution tracking, activation state, and rollback safety.

It is the companion to:

- `docs/architecture/data-sources.md`
- `docs/architecture/parsing-pipeline.md`
- `docs/architecture/rules-catalog-provider.md`

The intent is to make catalog trust and operational behavior explicit, queryable, and testable.

## Scope

In scope:

- lineage between external source input and active runtime catalog
- import-run observability by stage and outcome
- activation/rollback state and audit trail
- cross-database portability constraints (SQLite now, Postgres later)

Out of scope:

- full schema for each normalized rules entity (`ClassDefinition`, `SpellDefinition`, etc.)
- UI screens for operations tooling

## Design Principles

1. **Lineage is first-class data**: every active catalog must be traceable to an input fingerprint and importer version.
2. **Activation is atomic**: runtime points to one active catalog version at a time.
3. **Runs are auditable**: import stages, failures, and warnings are persisted.
4. **Rollback is cheap**: switching active catalog should be a metadata operation.
5. **Portability-first**: avoid DB-specific features that complicate SQLite -> Postgres migration.

## Proposed Persistence Model (v1)

### 1) `catalog_versions`

Represents a publishable catalog build artifact and its provenance.

Suggested fields:

- `id` (string, CUID/UUID)
- `provider_kind` (`derived` | `raw`)
- `dataset_fingerprint` (string, deterministic hash)
- `dataset_label` (nullable string; human-readable source version/tag)
- `source_ref` (nullable string; archive/version/commit ref)
- `importer_version` (string; parser/normalizer implementation version)
- `status` (`draft` | `validated` | `published` | `failed` | `retired`)
- `created_at`, `validated_at`, `published_at` (timestamps)
- `metadata_json` (JSON/text; non-critical auxiliary metadata)

Constraints:

- unique constraint on `(provider_kind, dataset_fingerprint, importer_version)`
- `status` transitions must be monotonic unless explicitly retired

### 2) `catalog_import_runs`

Represents a pipeline execution attempt.

Suggested fields:

- `id` (string)
- `catalog_version_id` (nullable FK while run is initializing)
- `trigger_kind` (`manual` | `ci` | `startup_guard` | `admin`)
- `requested_by_user_id` (nullable FK)
- `integrity_mode` (`strict` | `warn` | `off`)
- `started_at`, `finished_at` (timestamps)
- `outcome` (`running` | `succeeded` | `failed` | `cancelled`)
- `current_stage` (string enum-like value)
- `dataset_fingerprint_observed` (nullable string)
- `source_manifest_json` (JSON/text)
- `stage_metrics_json` (JSON/text; durations/counters)
- `error_summary` (nullable text)

Notes:

- Keep this table append-only from an audit perspective (update only current-state columns during run, never delete historical runs).

### 3) `catalog_import_issues`

Persists diagnostics emitted during validation/parse/normalize/publish stages.

Suggested fields:

- `id` (string)
- `run_id` (FK to `catalog_import_runs`)
- `stage` (`sync` | `fingerprint` | `validate_source` | `resolve` | `normalize` | `validate_domain` | `publish`)
- `severity` (`info` | `warn` | `error`)
- `code` (string machine code)
- `message` (text)
- `file_path` (nullable text)
- `json_pointer` (nullable text)
- `details_json` (JSON/text)
- `created_at` (timestamp)

Operational benefit:

- Enables targeted retry analysis and AI-agent triage without scraping logs.

### 4) `catalog_runtime_state`

Singleton pointer table that defines the active catalog for runtime reads.

Suggested fields:

- `id` (int, fixed `1`)
- `active_catalog_version_id` (FK to `catalog_versions`)
- `last_integrity_check_at` (nullable timestamp)
- `last_integrity_status` (`ok` | `warn` | `mismatch`)
- `last_integrity_message` (nullable text)
- `updated_at` (timestamp)

Rationale:

- This avoids relying on partial unique indexes like `WHERE is_active = true`, which are less portable across tooling/ORM constraints.

### 5) `catalog_activation_events`

Audit log for active-version changes.

Suggested fields:

- `id` (string)
- `from_catalog_version_id` (nullable FK)
- `to_catalog_version_id` (FK)
- `run_id` (nullable FK)
- `activated_by_user_id` (nullable FK)
- `reason` (nullable text)
- `created_at` (timestamp)

## Suggested Prisma-Style Model Skeleton

The following is intentionally illustrative and may be adapted to final naming conventions:

```prisma
model CatalogVersion {
  id                 String   @id
  providerKind       String
  datasetFingerprint String
  datasetLabel       String?
  sourceRef          String?
  importerVersion    String
  status             String
  metadataJson       Json?
  createdAt          DateTime @default(now())
  validatedAt        DateTime?
  publishedAt        DateTime?

  importRuns         CatalogImportRun[]

  @@unique([providerKind, datasetFingerprint, importerVersion])
}

model CatalogImportRun {
  id                         String   @id
  catalogVersionId           String?
  triggerKind                String
  requestedByUserId          String?
  integrityMode              String
  outcome                    String
  currentStage               String
  datasetFingerprintObserved String?
  sourceManifestJson         Json?
  stageMetricsJson           Json?
  errorSummary               String?
  startedAt                  DateTime @default(now())
  finishedAt                 DateTime?

  catalogVersion             CatalogVersion? @relation(fields: [catalogVersionId], references: [id])
  issues                     CatalogImportIssue[]
}

model CatalogImportIssue {
  id          String   @id
  runId       String
  stage       String
  severity    String
  code        String
  message     String
  filePath    String?
  jsonPointer String?
  detailsJson Json?
  createdAt   DateTime @default(now())

  run         CatalogImportRun @relation(fields: [runId], references: [id])
}

model CatalogRuntimeState {
  id                    Int      @id
  activeCatalogVersionId String
  lastIntegrityCheckAt  DateTime?
  lastIntegrityStatus   String?
  lastIntegrityMessage  String?
  updatedAt             DateTime @updatedAt

  // active version relation may be modeled explicitly once schema is finalized
}

model CatalogActivationEvent {
  id                   String   @id
  fromCatalogVersionId String?
  toCatalogVersionId   String
  runId                String?
  activatedByUserId    String?
  reason               String?
  createdAt            DateTime @default(now())
}
```

## Activation Protocol

Activation must be a single transaction:

1. Verify target `catalog_versions.status = 'published'`.
2. Read current active version from `catalog_runtime_state`.
3. Insert `catalog_activation_events` row.
4. Update `catalog_runtime_state.active_catalog_version_id`.
5. Commit.

If any step fails, the active version must remain unchanged.

## Rollback Protocol

Rollback is an activation to a previous known-good catalog version.

Requirements:

- previous version must still exist and have `published` status
- rollback writes a new `catalog_activation_events` row (never mutate history)
- runtime state pointer update remains transactional

## Integrity Check Integration

At startup and on import completion, runtime performs lineage checks:

- load active version from `catalog_runtime_state`
- compare expected/observed fingerprint and provider metadata
- record result in `catalog_runtime_state.last_integrity_*`

Behavior then follows `DATA_INTEGRITY_MODE` policy.

## Query Patterns and Indexing

Minimum indexes:

- `catalog_versions(provider_kind, dataset_fingerprint, importer_version)` unique
- `catalog_import_runs(started_at)`
- `catalog_import_runs(catalog_version_id)`
- `catalog_import_issues(run_id, severity, stage)`
- `catalog_activation_events(created_at)`

Common reads:

- current active catalog
- latest successful run
- issues for a run grouped by stage/severity
- activation history timeline

## SQLite -> Postgres Portability Notes

- Prefer string IDs (CUID/UUID) to avoid sequence coupling concerns.
- Treat enum-like fields as strings in v1 unless enum migrations are managed carefully.
- Use JSON fields conservatively (they map to text/jsonb depending on backend).
- Avoid partial-index-dependent logic for active pointer semantics.

## Operational Runbook (First Version)

Expected lifecycle:

1. sync external source
2. run import pipeline
3. inspect run issues and outcome
4. publish/activate if successful
5. monitor integrity checks and runtime provider status

On failure:

- inspect `catalog_import_issues`
- fix source/pipeline issue
- rerun import
- rollback active version only if a bad catalog was activated

## Open Design Questions

1. Should we split source metadata into a dedicated `catalog_sources` table for deduplication?
2. Do we need per-entity import metrics at v1 (counts by type) as first-class columns vs JSON metrics?
3. Should we enforce activation approval workflow in-app or keep it command-driven initially?

## Related Docs

- `docs/architecture/data-sources.md`
- `docs/architecture/parsing-pipeline.md`
- `docs/architecture/rules-catalog-provider.md`
- `docs/architecture/app-architecture.md`
