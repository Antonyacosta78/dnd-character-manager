# Implementation Plan Template Adoption

## Metadata

- Status: `completed`
- Created At: `2026-05-18`
- Last Updated: `2026-05-18`
- Owner: `Antony Acosta`

## Changelog

- `2026-05-18` - `Antony Acosta` - Promoted implementation plan template v2 as default, deprecated v1, and recorded legacy plan coverage for migration clarity. Made with OpenCode.

## Current Default

- Canonical template for new plans: `docs/templates/implementation-plan-template.md`
- Default template version: `v2`

## Deprecated Template

- Legacy template: `docs/templates/implementation-plan-template-v1-deprecated.md`
- Deprecated as of: `2026-05-18`
- Rule: do not use v1 for new implementation plans.

## Legacy Plans Using v1

- `docs/specs/authentication/implementation-plan.md`
- `docs/specs/character-core/implementation-plan.md`
- `docs/specs/design-system/implementation-plan.md`
- `docs/specs/foundation/global-state-management-implementation-plan.md`
- `docs/specs/foundation/implementation-plan.md`
- `docs/specs/global-settings/implementation-plan.md`
- `docs/specs/internationalization/implementation-plan.md`
- `docs/specs/observability/implementation-plan.md`
- `docs/specs/rules-catalog/catalog-publish-and-rules-catalog-interface-implementation-plan.md`

## Migration Policy

- Existing completed plans stay as-is; no backfill rewrite required.
- If a legacy plan is reopened for substantial edits, either:
  - migrate the document to v2 structure, or
  - explicitly add `Template Version: v1 (legacy)` in metadata and keep edits scoped.

## New Plan Policy

- New implementation plans should start from `docs/templates/implementation-plan-template.md`.
- New plans should include `Template Version: v2` in metadata for audit clarity.
