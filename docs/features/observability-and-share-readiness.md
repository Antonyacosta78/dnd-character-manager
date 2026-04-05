# Feature Rundown: Observability and Share Readiness

## Metadata

- Status: `proposed`
- Created At: `2026-04-05`
- Last Updated: `2026-04-05`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-05` - `Antony Acosta` - Resolved MVP observability decisions: use Sentry Cloud first, include structured context plus optional free-text in bug reports, and expose request IDs in UI only on failure states. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Created a lean observability and bug-capture rundown focused on runtime reliability for external-user readiness without broad analytics scope. (Made with OpenCode)

## Summary

Add a lightweight observability foundation so production bugs are visible, traceable, and supportable when the app is shared with unknown users.

This feature serves both players and DMs by reducing silent failures in core prep flows (sign-in, character management, export) while staying intentionally small. The MVP focus is runtime reliability and support speed, not deep product analytics.

## Must Have

- Capture unhandled client runtime errors with release and environment tags.
- Capture API and server exceptions with structured logs and normalized error codes.
- Propagate request correlation IDs so one issue report can be traced across app and API events.
- Redact sensitive auth/session data from telemetry and logs by default.
- Provide a minimal error visibility surface for top recurring issues and recent spikes.
- Add a simple issue-reporting path that includes practical reproduction context (for example timestamp, page/route, optional request ID).

## Nice to Have

- Add first-pass breadcrumbs for key user actions immediately before a crash.
- Add severity-based alert thresholds for high-impact error spikes.
- Add light issue grouping hints (for example by route + error code) to speed triage.

## Non-Functional Requirements

- Security: logs and telemetry never capture passwords, tokens, or raw session payloads.
- Reliability: error capture works consistently in both client and API surfaces.
- Performance: instrumentation overhead remains low and does not noticeably degrade route responsiveness.
- Maintainability: logging/event contracts stay small, typed, and easy to extend without breaking existing consumers.
- Operability: support responders can move from user report to probable root cause quickly.

## Acceptance Criteria

- Unhandled client runtime exceptions are captured with environment and release tags.
- API error paths emit structured logs including at least `requestId`, route context, and normalized error code.
- A user-submitted bug report with timestamp and optional request ID can be correlated to backend logs in under 5 minutes.
- A maintainer can view top recurring production errors and last-24-hour spike signals from one operational surface.
- Telemetry payload review confirms that sensitive auth/session values are redacted or excluded.
- Scope guardrail holds: MVP ships bug-capture reliability and excludes broad product-analytics funnels.

## Open Questions

- None currently.

## Resolved Decisions

- MVP error capture and dashboarding target: Sentry Cloud.
- Issue reporting includes structured context (timestamp, route, optional request ID) plus optional user free-text notes.
- Request IDs are shown in UI failure states only, not as an always-visible diagnostics affordance.

## Related Specs

- `docs/specs/observability/foundation.md` (planned)
- `docs/specs/observability/implementation-plan.md` (planned)

## Related Architecture

- `docs/architecture/api-error-contract.md`
- `docs/architecture/app-architecture.md`
