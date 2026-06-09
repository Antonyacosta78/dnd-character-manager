# Architecture: API and Error Contract

## Metadata

- Status: `accepted`
- Created At: `2026-04-03`
- Last Updated: `2026-06-09`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-09` - `Antony Acosta` - Rewrote this document as a generalized architecture-level error/taxonomy contract aligned to the backend rearchitecture proposal instead of route-specific surface contracts. Made with OpenCode.
- `2026-06-09` - `Antony Acosta` - Removed migration-step references so this canonical API/error contract describes only the current active transport baseline. Made with OpenCode.
- `2026-06-08` - `Antony Acosta` - Rewrote the API/error contract to match the active backend baseline. Removed outdated catalog-health and rules-read contract language from the canonical active contract. Made with OpenCode.
- `2026-04-05` - `Antony Acosta` - Marked API/error contract as accepted for Phase 0 surfaces (`ops:catalog:health` plus optional example rules-read route) while keeping full rules-entity endpoint definitions intentionally deferred. Made with OpenCode.
- `2026-04-04` - `Antony Acosta` - Corrected status to match current implementation reality; contract surfaces are partially implemented and still in progress. Made with OpenCode.
- `2026-04-04` - `Antony Acosta` - Tuned status to reflect active implementation progress. Made with OpenCode.
- `2026-04-04` - `Antony Acosta` - Backfilled metadata and changelog sections for lifecycle tracking. Made with OpenCode.
- `2026-04-03` - `Antony Acosta` - Initial document created.

## Purpose

Define the canonical caller-facing transport and error contract for the backend architecture.

This document is architecture-level. It defines shared error taxonomy, ownership rules, envelope rules, sanitization, and default transport mappings. It does not define feature-specific success payloads or route-by-route API contracts.

## Scope

This contract applies to backend entrypoints implemented through:

- REST API route handlers
- server functions
- CLI entrypoints

This contract does not define:

- feature-specific request/response payloads
- feature-specific endpoint success schemas
- frontend presentation behavior

Feature-specific transport details should live in feature specs or implementation docs, while remaining consistent with this contract.

## Shared Envelope Rules

### REST API Envelope

```ts
interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

interface ApiSuccess<T> {
  data: T;
  meta: ResponseMeta;
}

interface ApiErrorResponse<TDetails = Record<string, unknown> | undefined> {
  error: {
    code: string;
    message: string;
    status: number;
    details?: TDetails;
  };
  meta: ResponseMeta;
}
```

Rules:

- every response includes `meta`
- every error response includes `status` that matches the HTTP status code
- `details` is optional and must remain caller-safe
- every HTTP response includes `x-request-id`
- raw stacks, SQL fragments, provider internals, secrets, tokens, and unsafe request payloads must not be exposed

### CLI Envelope

```ts
interface CliSuccess<T> {
  data: T;
  meta: ResponseMeta;
}

interface CliErrorResponse<TDetails = Record<string, unknown> | undefined> {
  error: {
    code: string;
    message: string;
    exitCode: number;
    details?: TDetails;
  };
  meta: ResponseMeta;
}
```

Rules:

- success payloads are written to `stdout`
- error payloads are written to `stderr`
- output should remain machine-parseable by default
- internal stacks, provider internals, and unsafe payloads must not be exposed

### Server-Function Failure Shape

Server functions do not need the same HTTP or CLI envelope, but they must still:

- sanitize internal failures before they cross the entrypoint boundary
- preserve typed failure meaning where useful to the caller
- avoid exposing raw implementation internals

## Base Typed Error Contract

All internal typed errors extend a shared `ServerError` base.

```ts
export interface ServerErrorInput {
  code: string;
  entity:
    | "entrypoint"
    | "middleware"
    | "orchestration"
    | "core"
    | "db-service"
    | "session-service";
  status: number;
  exitCode: number;
  message: string;
  cause?: unknown;
}

export class ServerError extends Error {
  readonly code: string;
  readonly entity: ServerErrorInput["entity"];
  readonly status: number;
  readonly exitCode: number;

  constructor(input: ServerErrorInput) {
    super(input.message, { cause: input.cause });
    this.name = this.constructor.name;
    this.code = input.code;
    this.entity = input.entity;
    this.status = input.status;
    this.exitCode = input.exitCode;
  }
}
```

Required properties on all typed errors:

- `code`: stable machine-readable error code
- `entity`: owning boundary/error family
- `status`: default HTTP status
- `exitCode`: default CLI exit code
- `message`: caller-safe or sanitizable error message

Optional runtime behavior inherited from `Error`:

- stack trace
- `cause`

## Error Taxonomy

Errors are classified by both:

- where they originate
- what kind of failure they represent

### Error Families

#### Entrypoint Errors

Meaning:

- transport-boundary failures
- unsupported or intentionally unavailable transport behavior
- transport-specific response/mapping failures

Examples:

- malformed transport state
- intentionally unavailable route/command
- transport-specific output construction failure

#### Middleware Errors

Meaning:

- shared transport-level failures before orchestration begins

Subfamilies:

- authentication middleware errors
- authorization middleware errors
- schema validation middleware errors

Examples:

- unauthenticated caller
- forbidden access at the entry boundary
- malformed request body/query/params

#### Orchestration Errors

Meaning:

- operation-level failures while coordinating services and core logic

Examples:

- not found
- conflict
- dependency failure with operation meaning
- unsupported workflow state

#### Core Errors

Meaning:

- business-rule violations
- invalid domain operations

Rules:

- core errors must stay domain/business focused
- core errors must not represent transport or infrastructure failures

#### Service Errors

Meaning:

- infrastructure/integration failures inside a service boundary

Subfamilies:

- DB service errors
- session service errors

Rules:

- service errors may preserve debugging detail for internal use
- orchestration may translate service errors into clearer operation-level meaning when appropriate

## Boundary Ownership Rules

- entrypoint owns transport translation and sanitization
- middleware owns entry-boundary checks before orchestration runs
- orchestration owns operation-level failure meaning
- core owns domain/business failure meaning
- services own provider/infrastructure failure meaning

Errors may cross boundaries, but they are sanitized only at the entrypoint boundary.

## Default Transport Mapping

These mappings are defaults. Feature-specific entrypoints may refine caller-facing response structure, but they must not redefine the taxonomy itself.

### REST API

- schema validation middleware errors -> `400 Bad Request`
- authentication middleware errors -> `401 Unauthorized`
- authorization middleware errors -> `403 Forbidden`
- orchestration not-found errors -> `404 Not Found`
- core business-rule errors -> `422 Unprocessable Entity`
- orchestration conflict errors -> `409 Conflict`
- service dependency failures -> `500 Internal Server Error` or `503 Service Unavailable`, depending on failure meaning
- intentionally unavailable entrypoint errors -> `501 Not Implemented`
- unexpected internal failures -> `500 Internal Server Error`

### Server Functions

- middleware, orchestration, core, and service errors should be translated into sanitized caller-safe failures
- raw implementation internals must not be exposed
- unexpected failures must be converted into a generic internal failure for the server-function boundary

### CLI

- expected operational errors preserve typed `exitCode`
- unexpected failures map to a generic non-zero internal failure exit code
- output must remain sanitized for external callers

## Logging And Sanitization Rules

Entrypoint owns logging.

That means:

- expected operational errors should be logged when surfaced through an entrypoint
- unexpected internal failures must always be logged
- lower layers may preserve detail and causes, but entrypoint decides what is logged and what is exposed

Development logging policy:

- log to `stdout` while developing

Production logging policy:

- redact or omit secrets, credentials, tokens, raw session payloads, unsafe request bodies, and other sensitive internals

Caller-facing sanitization rules:

- never expose raw stack traces
- never expose raw SQL/provider internals
- never expose unsafe request/session payloads
- keep `message` and `details` safe for callers

## Session Vs Authentication Rule

Use authentication middleware errors when:

- caller is not authenticated
- session is invalid
- session is expired

Use session service errors when:

- session provider cannot be reached
- session cannot be resolved due to provider/integration failure
- caller/session lookup fails inside the session-service boundary

## Implementation Notes

- route-specific success payloads should be documented in feature/spec docs, not here
- route-specific error codes may exist when feature semantics require them, but they must still fit this taxonomy
- a shell/reset baseline may intentionally expose `501 Not Implemented` entrypoints; that is still governed by this contract as an entrypoint-level failure

## Related Docs

- `docs/architecture/back-end-architecture.md`
- `docs/architecture/app-architecture.md`
- `docs/architecture/rearchitecture-proposal.md`
