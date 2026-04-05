# Architecture: <name>

## Metadata

- Status: `proposed` | `in-progress` | `blocked` | `accepted` | `deprecated`
- Created At: `YYYY-MM-DD`
- Last Updated: `YYYY-MM-DD`
- Owner: `<name or team>`

## Changelog

- Order entries from most recent to oldest.
- `YYYY-MM-DD` - `<author>` - <most recent change and why>
- `YYYY-MM-DD` - `<author>` - <older change and why>

## Purpose

- Explain the shared concern this note covers and why it matters across multiple features.
- State what risks this decision prevents (for example: coupling, drift, unsafe defaults).

## Current Plan

- Describe the current technical direction.
- Keep this focused on shared rules, boundaries, and system-wide behavior.
- When helpful, structure this section with clear subsections, such as:
  - scope
  - contracts/interfaces
  - behavior rules
  - error/failure semantics
  - examples (code snippets or payloads)

## Boundaries

- Describe what this architecture note governs and what it does not.
- This helps keep feature-specific details out of shared docs.

## Notes

- Capture constraints, tradeoffs, assumptions, migration concerns, and operational implications.
- Add implementation guidance that should stay consistent across features.

## Related Specs

- Link feature specs that rely on this shared technical direction.
- Add links as those specs are created.

## Related Features

- Link the features affected by this architecture note.
- Leave a short placeholder if the feature docs do not exist yet.

## Open Questions

- Record unresolved shared technical questions.
- Remove items once the architecture direction is stable.

## Optional Sections

Use any of these when the topic needs stronger precision:

- `Decision History` (alternatives considered and why they were rejected)
- `Compatibility and Migration` (rollout, fallback, backout)
- `Contract Appendix` (types, request/response schemas, CLI output schemas)
- `Error Taxonomy` (error codes and mapping rules)
- `Examples` (code snippets, sequence diagrams, payload examples)
- `Verification Expectations` (minimum tests/checks required before adoption)

These are optional. Keep the document readable; add only what materially reduces ambiguity.
