# Architecture: API and Error Contract

## Metadata

- Status: `in-progress`
- Created At: `2026-04-03`
- Last Updated: `2026-04-04`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-04` - `Antony Acosta` - Corrected status to match current implementation reality; contract surfaces are partially implemented and still in progress. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Tuned status to reflect active implementation progress. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Backfilled metadata and changelog sections for lifecycle tracking. (Made with OpenCode)
- `2026-04-03` - `Antony Acosta` - Initial document created.

## Purpose

Define the canonical transport and error contract for foundation-era operational and rules-read surfaces so implementations remain consistent across route handlers, CLI commands, application services, and adapters.

This note exists to prevent:

- envelope drift across surfaces (different `meta` or error shapes)
- inconsistent HTTP status and CLI exit-code mappings
- accidental leakage of internal errors (SQL traces, stack internals, provider internals)
- policy mismatches between integrity mode behavior and surface-level responses

## Current Plan

### Contract Scope (Phase 0)

This contract currently covers:

- required operational command surface: `bun run ops:catalog:health`
- optional example HTTP surface: `GET /api/rules/classes`

Full rules-entity endpoint definitions are deferred to a dedicated rules API contract doc.

### Shared Envelope Contracts

```ts
interface ResponseMeta {
  requestId: string;
  timestamp: string; // ISO-8601 UTC
}

interface ApiSuccess<T> {
  data: T;
  meta: ResponseMeta;
}

interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
  meta: ResponseMeta;
}

interface CliSuccess<T> {
  data: T;
  meta: ResponseMeta;
}

interface CliErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    exitCode: number;
    details?: Record<string, unknown>;
  };
  meta: ResponseMeta;
}
```

Envelope rules:

- `meta` is required on every success/error envelope (HTTP and CLI).
- `message` must be safe for user display/logging and must not include internals.
- `details` is optional and safe-only; no stack traces, SQL fragments, or raw provider internals.
- In HTTP errors, `status` must match actual HTTP status.

### Shared Surface Conventions

HTTP conventions:

- Transport: JSON over HTTP.
- Content type: `application/json; charset=utf-8`.
- Every response includes header `x-request-id`.
- If inbound `x-request-id` exists and is valid, reuse it; otherwise generate one.
- No HTML error bodies for contract routes.

CLI conventions:

- Success payloads are written to `stdout` as JSON.
- Error payloads are written to `stderr` as JSON.
- Exit code must map to stable error taxonomy.
- Command output should remain machine-parseable by default.

### Surface Contract: `bun run ops:catalog:health`

Purpose:

- Operational visibility into active catalog provider, fingerprint, and integrity state.

Execution policy:

- Command is intended for local operators/developers in v1.
- No HTTP auth challenge exists in command path.
- If later wrapped by operational tooling, caller authorization is enforced by host system.

Invocation:

- No args in v1.

Success output (`stdout`, exit code `0`):

```ts
interface CatalogHealthData {
  provider: "derived"; // raw unsupported in v1
  fingerprint: string;
  integrityStatus: "ok" | "warn" | "mismatch";
  activeCatalogVersionId: string | null;
  lastIntegrityCheckAt: string | null;
  dataIntegrityMode: "strict" | "warn" | "off";
}
```

Operational behavior:

- `integrityStatus = mismatch` in `strict` mode exits non-zero with `RULES_CATALOG_DATASET_MISMATCH`.
- `integrityStatus = warn` in `warn` mode returns exit code `0` and includes warn status in output.
- If no active catalog exists, command exits non-zero in strict mode and outputs mismatch diagnostics.

### Surface Contract (Optional Example): `GET /api/rules/classes`

Purpose:

- Return deterministic class option references for character creation/progression selection.
- Demonstrate HTTP envelope/error behavior without forcing full rules endpoint rollout in Phase 0.

Auth policy:

- `401` if unauthenticated.
- No admin requirement.

Query params:

- `q` (optional): case-insensitive search term.
  - trimmed length 1-80 when provided
  - invalid length returns `400`
- No pagination in Phase 0.

Success `200` response:

```ts
interface ClassOption {
  name: string;
  source: string;
}

interface ListClassesData {
  items: ClassOption[];
  count: number;
  dataset: {
    provider: "derived";
    fingerprint: string;
  };
}
```

Determinism requirements:

- Results must be sorted by `name` ascending, then `source` ascending.
- Identical input + identical dataset fingerprint must produce identical output order and content.

### Error Code Catalog and Mapping

```ts
type ErrorCode =
  | "AUTH_UNAUTHENTICATED"
  | "AUTH_FORBIDDEN"
  | "REQUEST_VALIDATION_FAILED"
  | "RULES_CATALOG_UNAVAILABLE"
  | "RULES_CATALOG_DATASET_MISMATCH"
  | "RULES_PROVIDER_UNSUPPORTED"
  | "INTERNAL_ERROR";
```

HTTP status mapping:

- `AUTH_UNAUTHENTICATED` -> `401`
- `AUTH_FORBIDDEN` -> `403`
- `REQUEST_VALIDATION_FAILED` -> `400`
- `RULES_CATALOG_UNAVAILABLE` -> `503`
- `RULES_CATALOG_DATASET_MISMATCH` -> `503` in strict mode; `200` health payload with warn/mismatch semantics when policy allows
- `RULES_PROVIDER_UNSUPPORTED` -> `503`
- `INTERNAL_ERROR` -> `500`

CLI exit-code mapping:

- `REQUEST_VALIDATION_FAILED` -> `1`
- `RULES_CATALOG_UNAVAILABLE` -> `2`
- `RULES_CATALOG_DATASET_MISMATCH` -> `2`
- `RULES_PROVIDER_UNSUPPORTED` -> `2`
- `INTERNAL_ERROR` -> `3`

Surface-level error mapping:

- `bun run ops:catalog:health`
  - `1`: `REQUEST_VALIDATION_FAILED`
  - `2`: `RULES_CATALOG_DATASET_MISMATCH`, `RULES_CATALOG_UNAVAILABLE`, `RULES_PROVIDER_UNSUPPORTED`
  - `3`: `INTERNAL_ERROR`

- Optional example route: `GET /api/rules/classes`
  - `400`: `REQUEST_VALIDATION_FAILED`
  - `401`: `AUTH_UNAUTHENTICATED`
  - `503`: `RULES_CATALOG_UNAVAILABLE`, `RULES_CATALOG_DATASET_MISMATCH`, `RULES_PROVIDER_UNSUPPORTED`
  - `500`: `INTERNAL_ERROR`

### Response Examples

Catalog health CLI success (`stdout`):

```json
{
  "data": {
    "provider": "derived",
    "fingerprint": "sha256:3f...",
    "integrityStatus": "ok",
    "activeCatalogVersionId": "cat_01HXYZ",
    "lastIntegrityCheckAt": "2026-04-03T19:14:11.221Z",
    "dataIntegrityMode": "strict"
  },
  "meta": {
    "requestId": "req_01HXYZ",
    "timestamp": "2026-04-03T19:14:11.224Z"
  }
}
```

Example classes success (optional route):

```json
{
  "data": {
    "items": [
      { "name": "Barbarian", "source": "PHB" },
      { "name": "Bard", "source": "PHB" }
    ],
    "count": 2,
    "dataset": {
      "provider": "derived",
      "fingerprint": "sha256:3f..."
    }
  },
  "meta": {
    "requestId": "req_01HXYZ",
    "timestamp": "2026-04-03T19:15:02.004Z"
  }
}
```

HTTP error response:

```json
{
  "error": {
    "code": "REQUEST_VALIDATION_FAILED",
    "message": "Query parameter 'q' must be between 1 and 80 characters.",
    "status": 400,
    "details": {
      "field": "q"
    }
  },
  "meta": {
    "requestId": "req_01HXYZ",
    "timestamp": "2026-04-03T19:15:44.332Z"
  }
}
```

Catalog health CLI error (`stderr`):

```json
{
  "error": {
    "code": "RULES_CATALOG_DATASET_MISMATCH",
    "message": "Active catalog fingerprint does not match expected fingerprint in strict mode.",
    "exitCode": 2
  },
  "meta": {
    "requestId": "req_01HXYZ",
    "timestamp": "2026-04-03T19:16:44.332Z"
  }
}
```

### Data and Flow

- CLI runner resolves request id and calls pre-wired health use-case.
- Optional route handler validates transport input and calls pre-wired classes use-case.
- Application layer enforces auth/authz and orchestrates port calls.
- `RulesCatalog` adapter returns deterministic typed data or operational errors.
- CLI/route surfaces map use-case result/error into canonical envelope.

## Boundaries

This architecture note governs:

- transport-level success/error envelope shape across foundation surfaces
- error-code taxonomy and status/exit mappings
- contract behavior for Phase 0 operational health command
- optional example behavior for a single rules-read route

This architecture note does not govern:

- full rules entity API design (pagination/filtering/versioning across all entities)
- import pipeline internals
- domain modeling for character progression/branches/snapshots
- UI presentation decisions beyond transport payload shape

## Notes

Constraints and edge cases:

- `RULES_PROVIDER=raw` is unsupported in v1; command/route should fail with `RULES_PROVIDER_UNSUPPORTED` if runtime config bypasses startup validation.
- In strict integrity mode, mismatch is fail-closed (`503` for HTTP routes, non-zero exit for CLI commands).
- Query validation must happen before adapter calls.
- No direct `external/` file access in route handlers.
- Full rules-entity endpoint definitions are intentionally deferred to a dedicated rules API contract doc.

Implementation guidance:

- Keep request-id generation/reuse in a shared utility so CLI and route surfaces cannot drift.
- Keep error-code constants centralized to avoid string mismatch across layers.
- Keep envelope serialization in surface-layer helpers (HTTP responder + CLI printer), not inside domain logic.

## Related Specs

- `docs/architecture/app-architecture.md`
- `docs/architecture/rules-catalog-provider.md`
- `docs/architecture/data-sources.md`
- `docs/specs/foundation/implementation-plan.md`
- Placeholder: `docs/specs/rules-api/endpoint-suite.md` (future)

## Related Features

- Placeholder: `docs/features/foundation.md` (not created yet)
- Placeholder: rules API feature rundown (not created yet)

## Open Questions

- None for Phase 0 scope.
