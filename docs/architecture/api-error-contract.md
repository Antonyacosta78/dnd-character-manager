# Architecture: API and Error Contract

## Metadata

- Status: `accepted`
- Created At: `2026-04-03`
- Last Updated: `2026-06-08`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-08` - `Antony Acosta` - Rewrote the API/error contract to match the active post-cutover backend baseline. Removed outdated catalog-health and rules-read contract language from the canonical active contract. Made with OpenCode.
- `2026-04-05` - `Antony Acosta` - Marked API/error contract as accepted for Phase 0 surfaces (`ops:catalog:health` plus optional example rules-read route) while keeping full rules-entity endpoint definitions intentionally deferred. Made with OpenCode.
- `2026-04-04` - `Antony Acosta` - Corrected status to match current implementation reality; contract surfaces are partially implemented and still in progress. Made with OpenCode.
- `2026-04-04` - `Antony Acosta` - Tuned status to reflect active implementation progress. Made with OpenCode.
- `2026-04-04` - `Antony Acosta` - Backfilled metadata and changelog sections for lifecycle tracking. Made with OpenCode.
- `2026-04-03` - `Antony Acosta` - Initial document created.

## Purpose

Define the canonical caller-facing transport and error contract for the current active backend baseline.

This document covers active REST routes and the shared typed error mapping behavior used by the current backend entrypoint layer. It does not mark the overall rearchitecture as complete, and it does not reintroduce deprecated catalog/import CLI surfaces into the active contract.

## Current Active Scope

Current active HTTP contract surfaces:

- `GET /api/characters`
- `POST /api/auth/register`
- `GET /api/auth/[...all]`
- `POST /api/auth/[...all]`

Current active server-function contract surfaces:

- none

Current active CLI contract surfaces:

- none

## Shared Envelope Contracts

```ts
interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

interface ApiSuccess<T> {
  data: T;
  meta: ResponseMeta;
}

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
  meta: ResponseMeta;
}
```

Rules:

- every response includes `meta`
- every error response includes `status` that matches the HTTP status code
- `details` is optional and must remain caller-safe
- internal stacks, SQL fragments, raw provider payloads, and implementation internals must not be exposed
- every HTTP response includes `x-request-id`

## Internal Typed Error Contract

All internal typed errors extend the shared `ServerError` base and carry:

- `code`
- `entity`
- `status`
- `exitCode`
- `message`

Current error family entities:

- `entrypoint`
- `middleware`
- `orchestration`
- `core`
- `db-service`
- `session-service`

## REST Mapping Rules

Default REST mapping in the current baseline:

- schema validation middleware errors -> `400`
- authentication middleware errors -> `401`
- authorization middleware errors -> `403`
- orchestration validation errors -> `400`
- orchestration forbidden errors -> `403`
- not-implemented entrypoint errors -> `501`
- dependency/internal failures -> `500` unless a specific typed status is defined otherwise
- unknown unexpected failures -> `500`

Current canonical error codes in active use:

- `REQUEST_VALIDATION_FAILED`
- `AUTH_UNAUTHENTICATED`
- `AUTH_FORBIDDEN`
- `AUTH_ROUTE_NOT_IMPLEMENTED`
- `INTERNAL_ERROR`

## Route-Specific Contracts

### `GET /api/characters`

Success `200`:

```ts
interface CharacterListItem {
  id: string;
  name: string;
  ownerUserId: string;
  updatedAt: string | Date;
}

interface ListOwnerCharactersData {
  items: CharacterListItem[];
}
```

Failure mappings:

- `401` -> `AUTH_UNAUTHENTICATED`
- `403` -> `AUTH_FORBIDDEN`
- `500` -> `INTERNAL_ERROR`

### `POST /api/auth/register`

Success `200`:

```ts
interface RegisterData {
  created: true;
}
```

Response behavior:

- may append `set-cookie` headers when session creation succeeds

Failure mappings:

- `400` -> `REQUEST_VALIDATION_FAILED`
- `500` -> `INTERNAL_ERROR`

Validation details may include field-level issues for:

- `username`
- `password`
- `email`
- `body`

### `GET /api/auth/[...all]`

Current active behavior:

- returns `501`
- error code: `AUTH_ROUTE_NOT_IMPLEMENTED`

### `POST /api/auth/[...all]`

Current active behavior:

- returns `501`
- error code: `AUTH_ROUTE_NOT_IMPLEMENTED`

This intentional unavailability is part of the current cutover/reset baseline and is not treated as an accidental transport failure.

## Server-Function and CLI Notes

Server-function mapping:

- shared sanitization helpers exist
- no active server-function operation currently exposes a caller-facing contract

CLI mapping:

- typed CLI error mapping helpers exist in scaffolding
- no active CLI command is part of the current canonical backend contract
- deferred catalog/import CLI work is intentionally excluded from this active contract and remains outside Step 6 completion claims

## Related Docs

- `docs/architecture/back-end-architecture.md`
- `docs/architecture/app-architecture.md`
- `docs/architecture/rearchitecture-proposal.md`
