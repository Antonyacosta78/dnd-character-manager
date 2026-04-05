# Architecture: Internationalization (i18n)

## Metadata

- Status: `accepted`
- Created At: `2026-04-04`
- Last Updated: `2026-04-04`
- Owner: `foundation architecture`

## Changelog

- `2026-04-04` - `Antony Acosta` - Corrected status to match current implementation reality; i18n architecture direction is accepted and now reflected by foundation code. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Aligned architecture scope with resolved product decisions by deferring switcher placement to Global Settings and adding pseudolocalization enforcement timing before first real UI beta. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Updated metadata and changelog format to match template updates. (Made with OpenCode)
- `2026-04-04` - `Antony Acosta` - Initial i18n architecture document created. (Made with OpenCode)

## Purpose

Define a single internationalization direction for the Next.js App Router codebase so locale resolution, translation loading, formatting, and fallback behavior stay consistent as feature work grows.

This note exists to prevent:

- ad-hoc hardcoded strings across components
- mixed locale resolution behavior across server and client
- business/domain layers leaking user-facing translated text
- broken UX from missing translation keys in production

## Current Plan

### Platform Direction

The app uses `next-intl` as the i18n integration for App Router because it aligns with server components, request-aware locale handling, and typed translation key workflows without adding framework mismatch overhead.

Alternative libraries remain valid for specific needs, but this architecture standardizes shared implementation patterns to keep one coherent approach.

### Locale Resolution Strategy

- Locale is not represented as a URL segment.
- Initial locales: `en` (default) and `es`.
- Locale detection order:
  1. persisted locale cookie
  2. persisted locale in localStorage (client-side only)
  3. `Accept-Language` best match
  4. default locale (`en`)
- Server-rendered paths use cookie + `Accept-Language`; localStorage is a client preference cache and should synchronize into cookie when set.

### Message Storage and Namespacing

- Messages live in `messages/<locale>/` as JSON.
- Namespaces follow product domains, not component names, for example:
  - `common.json`
  - `navigation.json`
  - `character.json`
  - `progression.json`
- Keys are stable identifiers; key names must not embed English sentence text.
- Use ICU message syntax for pluralization, interpolation, and select rules.

### Runtime Boundaries

- Server components and metadata generation use server-side translation helpers.
- Client components use localized hooks only when they own interactive copy.
- Shared presentational components receive final strings via props when practical to reduce deep translation coupling.
- Domain/application/port layers return typed codes and values, never localized end-user prose.
- API and CLI contracts continue to expose stable machine-readable error codes; UI surfaces map those codes to translated messages.

### Formatting Rules

- Dates, numbers, and list formatting use locale-aware `Intl` behavior via the i18n integration.
- Formatting must be deterministic for tests by providing explicit locale/timezone inputs in test scenarios.
- Currency formatting is deferred until currency-backed product features exist.

### Failure Semantics and Fallbacks

- Missing message keys fail fast in development.
- Production behavior falls back to default locale keys and logs structured diagnostics.
- Locale catalogs are validated in CI to catch missing required keys before merge.
- Pseudolocalization is not a CI gate; it may run as a local pre-commit check (for example via Husky) when UI surfaces become active.
- Stronger pseudolocalization enforcement is required before the first real UI beta.

### Diagnostics and Logging

- Server-side request logs include the resolved locale code on every request.
- Locale logging must avoid including user-provided untranslated free text.

### SEO and Metadata

- Canonical URLs remain locale-neutral because locale is not encoded in path.
- `hreflang` alternate route variants are not emitted while URL structure is locale-neutral.
- Root `<html lang>` reflects the resolved request locale.

## Boundaries

This architecture note governs:

- locale resolution and detection behavior
- translation message organization and usage patterns
- formatting and fallback behavior for user-facing UI text

This note does not govern:

- translation-management vendor selection (for example, Crowdin/Lokalise)
- editorial process for writing localized copy
- localization of third-party datasets or user-generated content
- language switcher placement and settings IA, which are deferred to a future Global Settings feature

## Notes

### Why `next-intl` for this codebase

- Best App Router alignment with minimal glue code.
- Good ergonomics for server + client component boundaries.
- Supports typed key workflows and ICU formatting without custom infrastructure.

### Tradeoffs

- Library-specific setup is more opinionated than hand-rolled i18n.
- Team must enforce namespace and key hygiene to avoid catalog sprawl.
- Locale-neutral URLs simplify routing and avoid URL migration work while the app has no frontend surface.

## Related Specs

- `docs/specs/internationalization/foundation.md`
- `docs/specs/internationalization/implementation-plan.md`

## Related Features

- Character creation and progression UI (localized labels, prompts, validation copy)
- Authentication and account settings UI (localized status/errors)
- Playable output/export surfaces (localized UI chrome; rules data localization deferred)

## Open Questions

- None currently.
