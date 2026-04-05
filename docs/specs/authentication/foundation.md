# Spec: Authentication and Identity Foundation (Phase 1)

## Metadata

- Status: `proposed`
- Created At: `2026-04-05`
- Last Updated: `2026-04-05`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-05` - `Antony Acosta` - Extended registration contract with client-side password confirmation and automatic post-registration session establishment so successful sign-up continues directly into authenticated flows.
- `2026-04-05` - `Antony Acosta` - Expanded Phase 1 auth foundation scope to treat MVP registration as a first-class authentication flow alongside sign-in, clarifying acceptance criteria and data flow so implementation and validation stay in one authoritative contract.
- `2026-04-05` - `Antony Acosta` - Linked the implementation plan artifact for Phase 1 execution sequencing and verification tracking.
- `2026-04-05` - `Antony Acosta` - Created the Phase 1 authentication and identity foundation spec with scope, acceptance criteria, error behavior, and sequencing notes so implementation planning can start from a stable contract. (Made with OpenCode)

## Related Feature

- `docs/features/authentication-and-identity-foundation.md`

## Context

- Phase 1 is now explicitly scoped to authentication and identity foundations before broader character workflows.
- Existing auth wiring already exists (`src/auth.ts`, `src/app/api/auth/[...all]/route.ts`, `src/server/adapters/auth/auth-session-context.ts`, `src/server/ports/session-context.ts`), but product-level behavior for ownership, protected routes, and error semantics needs a single technical contract.
- The highest-risk failure in this slice is ownership drift (for example, querying or mutating character data before validating authenticated identity and owner scope).
- `/characters` is the first protected end-to-end route and will be used as the validation anchor for both authn and authz behavior.

## Current Plan

### In scope

- Username/password credential paths for MVP registration and sign-in.
- Registration UX includes a basic client-side password confirmation check before API submission.
- User model behavior where:
  - `username` is required and unique.
  - `email` is optional/nullable and does not block account creation/sign-in.
- Session resolution through the existing session context port/adapter boundary.
- Application-layer authn/authz enforcement for character-owned operations before repository access.
- Route protection contract for `/characters`.
- API error behavior for auth failures aligned with `docs/architecture/api-error-contract.md`.

### Out of scope

- Email verification and email-driven recovery workflows.
- A separate top-level registration feature spec outside this authentication foundation contract.
- External providers (OAuth/social login).
- Account profile polish beyond fields required for MVP identity semantics.
- Multi-tenant/team ownership models.
- Admin-only console capabilities beyond current `isAdmin` session shape.

### Feature contract

1. **Identity model contract**
   - Every persisted character-linked record must carry user ownership semantics compatible with `ownerUserId` from `docs/architecture/app-architecture.md`.
   - Ownership is required at first write; unowned character records are not valid in this slice.

2. **Authentication contract**
   - Authentication entry flows accept `username + password` for both registration and sign-in.
   - Registration UI requires `password` and `confirmPassword` to match before server submission.
   - Successful registration creates a new user record with required credentials and optional/nullable `email`.
   - Successful registration also establishes an authenticated session for the created user (no separate sign-in step required).
   - Successful sign-in establishes a session resolvable through `SessionContextPort#getSessionContext()`.
   - Signed-out state resolves to `{ userId: null, isAdmin: false }` and must be handled explicitly.

3. **Authorization contract**
   - Application use-cases that read/write character-scoped data must:
     1) resolve session context,
     2) enforce authentication,
     3) enforce owner scope,
     4) only then call repository adapters.
   - Client-side checks are convenience only and never authoritative for access safety.

4. **Protected route contract (`/characters`)**
   - Unauthenticated page request to `/characters` does not render user data and must trigger defined signed-out behavior (redirect or equivalent explicit challenge).
   - Authenticated requests render only the current user's character scope.
   - Any cross-user access attempt through backing APIs/use-cases fails with explicit authorization denial semantics.

5. **Error contract alignment**
   - API surfaces in this slice use the shared envelope and code taxonomy from `docs/architecture/api-error-contract.md`.
   - Authentication failure: `AUTH_UNAUTHENTICATED` (`401`).
   - Authorization failure: `AUTH_FORBIDDEN` (`403`).
   - Validation failure (including duplicate username): `REQUEST_VALIDATION_FAILED` (`400`) with safe field-level detail.
   - Error payloads must not leak sensitive internals (password material, adapter internals, SQL details, stack traces).

### Non-functional requirements

- **Security**: no signed-out or cross-user request can read/write character-owned records.
- **Reliability**: session resolution is deterministic for server-rendered requests and route handlers.
- **Maintainability**: auth provider specifics remain inside adapters; application/domain depend on ports only.
- **Observability**: auth deny paths are diagnosable with request IDs and stable error codes, without sensitive payload logging.
- **Testability**: allow/deny paths can be validated with deterministic fixtures for signed-out, owner, and non-owner scenarios.

### Acceptance criteria (testable)

1. **Registration success (valid payload)**
   - Given a valid registration payload with unique `username` and required `password`, user creation succeeds and the flow establishes an authenticated session without requiring a separate sign-in action.

2. **Registration duplicate username failure**
   - Given an existing account with username `u1`, when a registration attempt is made with `u1`, creation fails with `REQUEST_VALIDATION_FAILED` and no duplicate user is persisted.

3. **Registration invalid payload failure**
   - Given a registration payload missing required credentials or with invalid field values, creation fails with `REQUEST_VALIDATION_FAILED` (`400`) using the shared error envelope and safe field-level details.

4. **Registration password confirmation mismatch (client-side)**
   - Given registration input where `password` and `confirmPassword` differ, the UI blocks submission and shows clear mismatch feedback without calling the registration API.

5. **Nullable email behavior**
   - Given account creation without `email`, user creation succeeds and the persisted `email` value is `null` (or equivalent nullable representation).

6. **Session resolution contract**
   - Given a valid authenticated request, `SessionContextPort#getSessionContext()` returns the current `userId`.
   - Given no valid session, it returns `userId: null` and `isAdmin: false`.

7. **Application-layer guard order**
   - For character-scoped use-cases, authn/authz checks execute before repository access.

8. **`/characters` protected behavior (unauthenticated)**
   - Given a signed-out request to `/characters`, the response is explicit signed-out behavior and does not include character payloads.

9. **`/characters` owner scoping (authenticated)**
   - Given an authenticated user with characters, `/characters` and its backing data operations return only records owned by that user.

10. **Cross-user denial**
   - Given authenticated user A requesting user B's character resource through protected APIs/use-cases, the request fails with `AUTH_FORBIDDEN` and no resource payload.

11. **No email verification gate in MVP**
   - Given a newly created account with unverified or absent email, the user can still sign in via username/password and access `/characters` under normal ownership rules.

## Data and Flow

Inputs:

- Registration input (`username`, `password`, `confirmPassword`, optional `email`) from auth entry flow.
- Sign-in credential input (`username`, `password`) from auth entry flow.
- Session token/cookie headers on server requests.
- Character operation input (route params/body/query).

Transformation path:

1. Auth route handler (`/api/auth/[...all]`) handles credential registration/sign-in endpoints via Better Auth.
2. Registration UI performs password confirmation (`password === confirmPassword`) before submission.
3. Registration path validates payload, enforces username uniqueness, persists user identity fields (`username`, `password`, optional/nullable `email`), and establishes session state for the new user.
4. Sign-in path exchanges valid credentials for session state via Better Auth.
5. Server operation resolves session through `SessionContextPort`.
6. Application layer validates authn (`userId` presence) and authz (owner match).
7. Only authorized operations call repository adapters.
8. Route/page renders authorized data or returns contract-aligned denial behavior.

Trust boundaries:

- **Untrusted**: request input, cookies/headers, route params.
- **Validated**: authenticated identity + authorization result in application layer.
- **Trusted internal**: repository access scoped by validated user identity.

Outputs:

- Stable signed-in/signed-out behavior for `/characters`.
- Deterministic ownership-scoped character access.
- Contract-aligned API error envelopes for auth failures.

Shared references:

- `docs/architecture/app-architecture.md`
- `docs/architecture/api-error-contract.md`

## Constraints and Edge Cases

- **Duplicate usernames**
  - Must fail consistently with validation semantics; DB/provider unique errors must be normalized at application/API boundary.
- **Username normalization policy**
  - Phase 1 enforces uniqueness but does not expand into broader username canonicalization policy beyond what is required for deterministic uniqueness checks.
- **Missing/invalid session artifacts**
  - Treat as unauthenticated, never as partial access.
- **Cross-user identifiers**
  - Any attempted access to non-owned character IDs must fail closed (`AUTH_FORBIDDEN`).
- **Adapter/provider failures**
  - Return safe `INTERNAL_ERROR` contract responses; do not leak provider internals.
- **Fail-open vs fail-closed**
  - Fail-closed for authentication/authorization checks.
  - Fail-open is not permitted for ownership decisions.

## Related Files and Sequencing Notes

Expected implementation surfaces for this spec:

- Existing auth wiring and session context:
  - `src/auth.ts`
  - `src/app/api/auth/[...all]/route.ts`
  - `src/server/ports/session-context.ts`
  - `src/server/adapters/auth/auth-session-context.ts`
- Character-facing protected flow and ownership enforcement surfaces:
  - `src/app/characters/**/*` (route/page and related server actions)
  - `src/server/application/**/*` (authn/authz guard usage in character use-cases)
  - `src/server/ports/**/*` and `src/server/adapters/**/*` (only where ownership constraints require contract updates)
- Persistence model updates where needed:
  - `prisma/schema.prisma`
  - `prisma/migrations/**/*`

Recommended sequence:

1. Confirm identity data constraints (`username` unique, `email` nullable).
2. Wire/verify credential auth flow and session resolution behavior.
3. Apply application-layer authn/authz guards to character use-cases.
4. Protect `/characters` as first end-to-end validation route.
5. Validate error contract mappings for auth failures and duplicate username.

## Open Questions

- None for this Phase 1 slice.

## Related Implementation Plan

- `docs/specs/authentication/implementation-plan.md`
