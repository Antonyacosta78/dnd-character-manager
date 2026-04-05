# Feature Rundown: Authentication and Identity Foundation

## Metadata

- Status: `in-progress`
- Created At: `2026-04-04`
- Last Updated: `2026-04-05`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-05` - `Antony Acosta` - Added Phase 1 UX and flow requirements for client-side password confirmation on registration and immediate post-registration session establishment (auto sign-in) so onboarding reaches protected routes without a second auth step.
- `2026-04-05` - `Antony Acosta` - Expanded Phase 1 scope to include MVP self-service registration (`username`, `password`, optional `email`) so sign-in is paired with account creation in the same auth foundation slice.
- `2026-04-05` - `Antony Acosta` - Added the Phase 1 authentication implementation plan reference so execution can proceed with concrete sequencing.
- `2026-04-04` - `Antony Acosta` - Resolved remaining auth open questions: defer email verification past MVP hardening and use `/characters` as the first protected end-to-end validation route. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Locked MVP credential strategy to username plus password, made email optional, and added unique username requirement so implementation scope is clear before spec drafting. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Created the authentication and identity foundation rundown so roadmap execution can start with clear MVP boundaries and user ownership guardrails. (Made with OpenCode)

## Summary

Make identity real before character data grows: every character and future progression artifact should have a clear owner, and the app should behave predictably when no user session exists.

This feature serves players first by protecting personal character libraries in one-shots and campaign reuse. The first slice stays intentionally lean: reliable session and ownership behavior now, polished account UX later.

## Must Have

- Add a minimal sign-in entry path using username plus password that can establish a valid session in local and production environments.
- Add a minimal self-service registration entry path using username plus password (with optional email) that can create an account in local and production environments.
- Add simple client-side password confirmation on registration (password + confirm password match) before submitting to the server.
- Automatically establish a signed-in session after successful registration so users can continue directly to protected character surfaces.
- Require a unique username for each account at creation time.
- Keep email optional (`nullable`) in the user profile for this MVP slice.
- Resolve a current user identity for server-side app operations through a stable session context boundary.
- Enforce user ownership scope for character-linked read and write operations.
- Define unauthenticated behavior clearly for protected pages and API routes.
- Ensure authentication and authorization checks happen in the application layer before adapter calls.
- Keep account model compatible with future provider expansion without changing character ownership shape.

## Nice to Have

- Minimal signed-in header indicator (for example user display name + sign-out action).
- Basic unauthorized and signed-out helper copy that points users to the sign-in route.
- Local development fallback identity helper for non-interactive test flows.
- First-pass audit logging for auth failures without sensitive payload leakage.

## Non-Functional Requirements

- Security: protected routes do not leak user-scoped records when unauthenticated or cross-user access is attempted.
- Reliability: session resolution is deterministic and stable across refresh and server render.
- Maintainability: identity logic remains behind ports/adapters so provider swaps do not change use-case contracts.
- UX clarity: signed-out and unauthorized states are explicit and action-oriented, not silent failures.
- Testability: auth allow/deny paths can be validated with repeatable fixtures.

## Acceptance Criteria

- A new user can register with `username + password` (and optional `email`) and receive stable validation errors for duplicate username or invalid payloads.
- Registration UI performs a basic password confirmation check before submission and blocks mismatched passwords with clear user feedback.
- A successful registration flow establishes a valid session and transitions the user directly into authenticated app behavior.
- A signed-in user can reach protected surfaces and receives only their own scoped records.
- An unauthenticated request to a protected page or route returns defined signed-out behavior.
- Application use-cases that require identity read it from session context and enforce authz before repository access.
- Account creation enforces a unique username invariant; duplicate usernames are rejected with stable validation behavior.
- Email is optional for MVP account creation and storage; null email values do not block sign-in with username plus password.
- MVP does not require email verification before character creation.
- Character-linked persistence shape supports user ownership from first write (no global unowned records).
- Existing foundation auth route integration remains wired and usable for the selected entry flow.
- `/characters` is the first protected route used for end-to-end authentication and ownership validation.

## Open Questions

- None currently.

## Related Specs

- `docs/specs/authentication/foundation.md`
- `docs/specs/authentication/implementation-plan.md`
- `docs/specs/foundation/implementation-plan.md`

## Related Architecture

- `docs/architecture/app-architecture.md`
- `docs/architecture/api-error-contract.md`
