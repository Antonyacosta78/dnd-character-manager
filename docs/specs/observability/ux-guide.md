# Spec: Observability UX Guide (Phase 10 MVP)

## Metadata

- Status: `proposed`
- Created At: `2026-04-05`
- Last Updated: `2026-04-05`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-05` - `Antony Acosta` - Locked bug-report notes input to a `750`-character maximum for MVP and aligned form guidance expectations to that cap. (Made with OpenCode)
- `2026-04-05` - `Antony Acosta` - Created a focused MVP UX guide for failure visibility, bug-report flow behavior, accessibility, and i18n-safe copy rules so observability can ship with low-friction support outcomes. (Made with OpenCode)

## Related Feature

- `docs/features/observability-and-share-readiness.md`

## Related Spec

- `docs/specs/observability/foundation.md`

## Context

- Phase 10 is a reliability slice: reduce time from user failure -> actionable triage.
- Locked product decisions already constrain UX behavior:
  1. Sentry Cloud is the MVP provider.
  2. Bug reports include structured context (`timestamp`, `route`, optional `requestId`) plus optional notes.
  3. Request IDs appear in UI only on failure states.
- This guide defines practical user touchpoint behavior and copy constraints so implementation is consistent across routes and avoids support-tool sprawl.

## UX Scope (MVP)

In scope:

- Failure-state messaging and request ID visibility rules.
- Bug-report entry and submit-state behavior.
- Copy/tone contract for user-facing error messaging.
- Accessibility and i18n readiness requirements for these surfaces.

Out of scope:

- Always-on diagnostics UI.
- In-app support chat/escalation tooling.
- Advanced issue triage dashboards beyond Sentry.
- Product analytics instrumentation (funnels, retention, behavior tracking).

## Failure-State UX Contract (Where `requestId` Appears)

### Visibility Rule (hard)

1. Show `requestId` only when the UI is rendering a failure state tied to a failed API/runtime operation.
2. Do not show `requestId` in healthy/idle/success states.
3. Do not add persistent diagnostics affordances in app-shell chrome, settings, or profile surfaces.

### Failure Block Composition

Each recoverable failure state should include:

- Clear plain-language title (what failed).
- Short body guidance (what user can do now).
- `Request ID: <value>` row when available.
- Primary recovery action (for example Retry).
- Secondary action to open bug report flow.

If `requestId` is unavailable (for example client crash before response), omit the row rather than showing placeholders like `N/A`.

### Placement and hierarchy

- Place request ID beneath human-readable error guidance, not above headline copy.
- Style as secondary metadata so users read action guidance first.
- Keep request ID selectable/copyable.

## Error Copy Patterns and Tone Rules

### Tone

- Calm, direct, non-blaming.
- No internal jargon (avoid terms like "trace envelope" or "telemetry failure").
- Do not imply user fault unless clearly actionable input error exists.

### Copy Pattern

Use this structure:

1. **What happened** (single sentence).
2. **What to do next** (retry, check input, or submit report).
3. **Support hook** (request ID context when present).

### Good pattern examples (for localization intent)

- "We couldn’t save your changes. Try again. If this keeps happening, include the request ID in a bug report."
- "Something went wrong loading this page. Refresh or try again in a moment."

### Avoid

- "Unknown error occurred." (too vague)
- "Operation failed with code INTERNAL_ERROR." (internal-code leakage)
- Joke/error-snark copy that reduces trust during failure moments.

## Bug-Report Form UX Contract

### Required structured fields

The submitted payload must always include:

- `timestamp` (client-generated at submit time)
- `route`

Include when available:

- `requestId`

Optional user input:

- `notes` (free text)

### Field behavior

1. `timestamp`, `route`, and `requestId` (if present) are non-editable in UI and shown as contextual metadata.
2. `notes` is optional, multiline, and clearly labeled as optional.
3. Keep notes bounded to `750` characters and provide character-limit hint text.

### Privacy reassurance (required)

Show brief reassurance near submit action, e.g.:

- report includes technical context about this failure
- avoid entering passwords, tokens, or private secrets in notes

Do not make privacy text long legal prose; keep it scannable.

## Submission States (Bug Report)

### Idle

- Submit enabled (unless in-flight).
- Structured context visible.
- Optional notes empty allowed.

### Submitting

- Disable submit button and show progress label/spinner.
- Prevent duplicate submits.
- Keep visible context and notes content stable.

### Success

- Show clear confirmation (report sent).
- Keep request ID visible if it exists.
- Provide a close/done action; no forced redirect.

### Failure

- Show concise failure message with retry action.
- Preserve notes content so users do not retype.
- Keep request ID/context visible for manual sharing fallback.

## Accessibility Expectations

### Keyboard flow

1. Triggering "Report issue" moves focus to form heading.
2. Tab order: context summary -> notes -> submit -> cancel/close.
3. On submit success/failure, focus moves to status message region.

### Labels and semantics

- Notes input has explicit label and optional-helper text.
- Structured context rows use clear labels (`Timestamp`, `Route`, `Request ID`).
- Actions use label-first text; icon-only buttons need `aria-label` + `title`.

### Error/status announcements

- Submission success/failure announced via polite/assertive live region as appropriate.
- Validation or submit errors must be programmatically exposed, not color-only.

## i18n-Ready Copy and Fallback Behavior

1. No hardcoded user-facing strings in component code.
2. All user-facing failure, form, and status text must come from translation catalogs.
3. Keep machine fields locale-neutral (`requestId`, route values, error codes not shown to users unless explicitly required elsewhere).
4. Missing translation behavior follows project i18n contract:
   - fail fast in development
   - fallback to default locale in production with diagnostics
5. Do not log or emit user free-text notes in i18n diagnostics.

## Compatibility Guardrails (App Shell + Settings)

- Reuse existing modal/surface patterns for error and report entry; do not introduce new app-shell navigation destinations for observability.
- Do not add new global settings toggles in MVP for diagnostics/reporting behavior.
- Keep interaction model consistent with existing failure surfaces and form semantics.

## Explicit Non-Goals (to prevent overbuild)

1. No live support inbox UI or ticket timeline inside the app.
2. No public diagnostics console for users.
3. No mandatory notes field.
4. No multi-step wizard for basic bug report submission.
5. No expansion into analytics-event authoring from this UX work.

## Acceptance-Style UX Checks (Fast QA)

1. Trigger a failure state and confirm request ID is visible when available.
2. Visit equivalent healthy state and confirm request ID is not visible.
3. Open bug-report flow from failure UI and confirm `timestamp` + `route` are present without user input.
4. Confirm notes are optional; submission succeeds with empty notes.
5. Confirm submit button disables during in-flight and prevents duplicate submissions.
6. Force submission failure and verify notes persist + retry is available.
7. Complete keyboard-only flow from failure state -> report -> submit/close.
8. Verify screen reader announces submission success/failure.
9. Validate translated copy renders from catalog; no hardcoded English strings introduced.
10. Confirm no new app-shell/settings diagnostics entry points were added in MVP.

## Open Questions

- None for MVP UX scope.

## Related Implementation Plan

- `docs/specs/observability/implementation-plan.md` (planned)
