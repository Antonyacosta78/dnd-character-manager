---
root: false
targets: ["*"]
description: "Internationalization and user-facing text behavior contract"
globs: ["src/app/**/*", "src/components/**/*", "messages/**/*", "src/server/**/*", "src/app/api/**/*", "scripts/**/*"]
opencode:
  description: "Internationalization and user-facing text behavior contract"
---

# Internationalization and User-Facing Text

- Hard rule: never ship hardcoded user-facing text in UI routes/components. Any text visible to users must come from translation catalogs via i18n helpers.
- Hard rule: allow duplicated translated values across locales when needed. Do not deduplicate by forcing one language's wording into another; language-specific customization takes priority.
- Keep locale behavior aligned with `docs/architecture/internationalization.md` and `docs/specs/internationalization/foundation.md`.
- Preserve locale-neutral URLs. Do not introduce locale path segments unless architecture docs are updated first.
- Follow locale resolution priority: cookie -> localStorage (client cache) -> `Accept-Language` -> default `en`.
- Keep API, CLI, and domain surfaces locale-neutral: return stable machine-readable codes/values, not translated prose.
- Use the i18n request policy for missing keys: fail fast in development, fallback to default locale plus diagnostics in production.
- Keep diagnostics structured and include resolved locale context, but never log user free text as part of i18n diagnostics.
- Maintain key parity for required namespaces across supported locales and run `bun run i18n:check-catalog` when catalogs change.
- Treat translation key names as stable identifiers (domain-oriented), not as copies of English sentence text.
- If implementation behavior must diverge from this contract, update the i18n architecture/spec docs first and then update this rule.
