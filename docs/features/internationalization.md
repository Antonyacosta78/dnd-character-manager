# Feature Rundown: Internationalization Foundation (Locale-Ready v1)

## Metadata

- Status: `completed`
- Created At: `2026-04-04`
- Last Updated: `2026-04-04`
- Owner: `product foundation`

## Changelog

- `2026-04-04` - `Antony Acosta` - Corrected status to match current implementation reality; internationalization foundation slice is completed in code. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Deferred language switcher placement to a future Global Settings feature and kept i18n foundation scope focused on locale behavior only. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Resolved open product decisions for Spanish copy ownership, first language switcher placement, and pseudolocalization enforcement trigger. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Updated metadata and changelog format to match template updates. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Initial i18n feature rundown created. (Made with OpenCode)

## Summary

Establish a lean, reliable internationalization foundation so future UI can ship in multiple languages without reworking routing, logging, or copy boundaries later.

This feature serves both players and DMs across one-shots and campaigns by making language preference predictable from the first real screens onward. MVP is intentionally tight: lock in locale resolution, persistence, and fallback behavior now, while frontend language-polish work waits until more UI exists.

## Must Have

- Use `next-intl` as the shared i18n path for App Router UI copy and formatting.
- Keep locale-neutral URLs (no locale path segment) for all routes in this slice.
- Support initial locales: `en` (default) and `es`.
- Enforce deterministic locale resolution order:
  1. cookie
  2. localStorage client cache
  3. `Accept-Language`
  4. default `en`
- Ensure server render resolution uses cookie + `Accept-Language`, and client cache can converge preference back into cookie.
- Provide stable message catalog structure under `messages/<locale>/` with domain-first namespaces.
- Apply missing-key behavior aligned to architecture: fail fast in development; production fallback to default locale with diagnostics.
- Include resolved locale code in server request logs.
- Product owner owns Spanish (`es`) gameplay terminology quality review for early v1 terms (for example class, background, proficiency).

## Nice to Have

- Optional local pseudolocalization check in pre-commit flow (for example Husky), but not required in CI.
- Early translation key hygiene guide with examples of good/bad key naming.
- A lightweight language preference control stub once the first real interactive screen lands.
- Defer language switcher placement decisions to a future Global Settings feature.

## Non-Functional Requirements

- Reliability: locale resolution is deterministic and repeatable across refresh and navigation.
- Observability: locale diagnostics are structured and include resolved locale without leaking user free text.
- Maintainability: translation keys remain stable, domain-oriented, and decoupled from component internals.
- Performance: locale setup adds no noticeable delay for first render in this pre-UI slice.
- Testability: locale and formatting behaviors can be validated with explicit locale/timezone inputs.
- Release readiness: pseudolocalization enforcement becomes stronger before the first real UI beta.

## Acceptance Criteria

- A request resolves to `en` or `es` only, using the agreed fallback order.
- Locale is never encoded in route path segments.
- If client localStorage contains a valid locale that differs from cookie, client-side flow converges cookie to that locale.
- Invalid cookie/localStorage/header locale values are ignored and fall through to the next valid source.
- Server logs include resolved locale code for each request in this slice.
- Missing translation keys fail fast in development and use default-locale fallback + diagnostics in production behavior.
- Message catalogs for `en` and `es` exist in the expected folder strategy for the initial namespaces used by this slice.

## Open Questions

- None currently.

## Related Specs

- `docs/specs/internationalization/foundation.md`
- `docs/specs/internationalization/implementation-plan.md`

## Related Architecture

- `docs/architecture/internationalization.md`
