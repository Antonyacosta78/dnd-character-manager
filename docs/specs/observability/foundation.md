# Spec: Observability Foundation (Phase 10 MVP)

## Metadata

- Status: `proposed`
- Created At: `2026-04-05`
- Last Updated: `2026-04-05`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-05` - `Antony Acosta` - Locked bug-report notes length limit to `750` characters for MVP so UI helper text, API validation, and support expectations stay aligned. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Created a lean Phase 10 observability foundation contract for runtime bug capture, request correlation, and support-ready issue reporting with Sentry Cloud as the locked MVP provider. (Made with OpenCode)

## Related Feature

- `docs/features/observability-and-share-readiness.md`

## Context

- Roadmap Phase 10 is now defined as `Runtime Reliability And Bug Capture`, with status tracked as planned.
- The feature rundown has locked MVP decisions that remove key ambiguity:
  - Sentry Cloud is the first provider.
  - Issue reporting includes structured context + optional user free-text notes.
  - Request IDs are shown in UI on failure states only.
- Current risk is not lack of analytics; it is slow bug triage when production failures occur and cannot be correlated quickly.

This spec intentionally stays small: capture real failures, correlate reports to logs/events fast, and prevent sensitive payload leakage.

## Current Plan

### MVP scope (in)

- Client/runtime unhandled exception capture.
- API/server exception logging with stable structure and normalized error-code alignment.
- Request ID generation and propagation contract across app/API.
- Failure-state UI request ID exposure (only when an error state is rendered).
- Sentry Cloud integration for error capture, issue grouping, and operational triage surface.
- User bug-report payload contract with structured context + optional notes.
- Telemetry/log redaction defaults that block auth/session secret leakage.

### Explicitly out of scope (MVP)

- Product analytics funnels, conversion events, retention dashboards.
- Session replay, heatmaps, clickstream capture.
- Broad custom observability data lake pipelines.
- Always-visible diagnostics panel/request ID UI outside failure states.
- AI-assisted issue summarization or auto-remediation workflows.

### Contract: client/runtime exception capture

1. Unhandled client exceptions must be captured in production builds with at least:
   - `environment`
   - `release`
   - route context
   - `requestId` when available in current error context
2. Captured client events must be deduplicated/grouped by stack + error type + route to reduce alert noise.
3. Expected user-facing behavior on runtime failure:
   - show translated fallback error copy (no hardcoded UI text)
   - expose `requestId` only in the failure UI
   - offer issue-report entry from the failure surface

### Contract: API/server structured logging and error-code alignment

1. Server/API error logs must be structured JSON with this minimum shape:

```ts
interface ServerErrorLog {
  level: "error";
  timestamp: string; // ISO-8601 UTC
  message: string; // safe, non-secret
  requestId: string;
  route: string;
  method?: string;
  error: {
    code: ErrorCode; // from docs/architecture/api-error-contract.md
    status?: number;
    name?: string;
  };
  runtime: {
    environment: string;
    release?: string;
  };
}
```

2. `error.code` must use the existing API error taxonomy (`AUTH_UNAUTHENTICATED`, `REQUEST_VALIDATION_FAILED`, `INTERNAL_ERROR`, etc.).
3. No ad-hoc freeform error-code strings in transport or logs for contract routes.
4. If an unknown exception reaches the boundary, map to `INTERNAL_ERROR` for response contract; keep full stack/details internal to private telemetry only.

### Contract: request ID generation, propagation, and UI exposure

1. HTTP request ID behavior follows `docs/architecture/api-error-contract.md`:
   - accept/reuse valid inbound `x-request-id`
   - otherwise generate one
   - always return `x-request-id` on response
2. Response envelopes for errors include `meta.requestId` (already contract-required).
3. Client consumers must persist the latest relevant failure `requestId` in error state context for issue reporting.
4. UI contract:
   - request ID is visible only when rendering a failure state
   - request ID is not displayed as always-on diagnostics in healthy flows

### Contract: Sentry Cloud integration boundaries

In MVP:

- Capture client unhandled errors and server/API exceptions.
- Attach core tags/contexts: `environment`, `release`, `route`, `requestId`, normalized `error.code` when known.
- Use Sentry issue/grouping + recent spike views as the operational surface for top recurring failures.

Out in MVP:

- Session replay.
- Performance tracing beyond basic error event metadata.
- Custom analytics event taxonomy for product behavior.

### Contract: bug-report payload

Bug-report submissions from UI must follow this shape:

```ts
interface BugReportPayload {
  timestamp: string; // client-generated ISO-8601 UTC at submit time
  route: string;
  requestId?: string; // included when failure context has one
  notes?: string; // optional user free-text
}
```

Rules:

- `timestamp` and `route` are required.
- `requestId` is optional but strongly preferred when present in failure context.
- `notes` is optional and user-authored; preserve as provided except bounded length (`max 750` characters) + basic sanitization.
- Bug-report payload must be linkable to telemetry/log search by `requestId` and time window.

### Contract: privacy, redaction, and safe diagnostics

- Never capture secrets (passwords, tokens, raw auth headers, session blobs) in logs/telemetry.
- Redact or drop known sensitive fields before sending to Sentry/log sinks.
- Do not include raw request/response bodies by default in error events.
- Free-text `notes` must never be re-logged into i18n diagnostics or unrelated debug channels.
- User-facing messages remain translated and safe; machine-readable codes remain locale-neutral.

### Acceptance criteria (testable)

1. Unhandled client runtime exceptions appear in Sentry Cloud with `environment`, `release`, and route context.
2. API error paths emit structured logs containing `requestId`, route, and normalized `error.code`.
3. Failure responses carry `x-request-id` and `meta.requestId`, and failure UI displays request ID.
4. Non-failure UI paths do not display request ID diagnostics.
5. Bug report with `{ timestamp, route, requestId? }` can be correlated to matching server logs/Sentry issue within 5 minutes.
6. Telemetry payload review confirms no auth/session secret leakage.
7. MVP ships without analytics funnels/session replay scope expansion.

### Verification approach

Smallest useful checks for this slice:

- Unit/integration checks for request-ID propagation utility and error-envelope behavior.
- API route tests that assert normalized error-code + structured log contract.
- Manual failure-path smoke:
  - trigger client runtime error and verify Sentry event tags
  - trigger API error and verify `x-request-id` + UI error-state request ID visibility
  - submit bug report payload and verify correlatability using request ID/time
- Redaction verification by inspecting emitted event payload samples (no secrets).

## Data and Flow

Inputs:

- Untrusted runtime exceptions (client and server).
- HTTP request metadata (`x-request-id`, route, method).
- Error envelope metadata (`meta.requestId`, `error.code`).
- Optional user bug-report notes.

Flow:

1. Request enters API route; request ID is reused/generated at boundary.
2. Application/API operation succeeds or fails with normalized code contract.
3. On failure, API returns contract error envelope + `x-request-id`; server emits structured error log and Sentry event.
4. Client failure surface renders translated error copy + request ID (failure-only exposure).
5. User optionally submits bug report with structured context + notes.
6. Support triage uses request ID + timestamp to correlate UI report to logs/Sentry issue.

Outputs:

- Correlatable runtime error signal across UI, API, and Sentry.
- Stable support payload contract for reproducible issue triage.
- Minimal operational visibility for recurring errors and short-window spikes.

## Constraints and Edge Cases

- Missing inbound request ID: generate deterministic internal ID and continue.
- Invalid inbound request ID format: discard and generate new safe ID.
- Unknown thrown error type: map outward response to `INTERNAL_ERROR`, preserve safe internal diagnostics.
- Client crash before API call: bug report may omit `requestId`; correlation falls back to timestamp + route + release.
- High-volume repeated errors: rely on grouping to reduce alert fatigue; avoid per-event noisy custom tags.
- Offline/failed bug-report submit: keep failure UI visible with request ID so user can share manually.

## Open Questions

- None for MVP scope.

## Related Implementation Plan

- `docs/specs/observability/implementation-plan.md` (planned)
