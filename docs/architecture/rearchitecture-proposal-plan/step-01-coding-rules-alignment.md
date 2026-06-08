# Step 1: Coding Rules Alignment

## Metadata

- Status: `ready`
- Created At: `2026-06-07`
- Last Updated: `2026-06-07`
- Owner: `Antony Acosta`

## Changelog

- `2026-06-07` - `Antony Acosta` - Marked step 1 as ready after review so coding-rules alignment can begin immediately. Made with OpenCode.
- `2026-06-07` - `Antony Acosta` - Added step-1 implementation plan for aligning `.rulesync` coding standards with the backend rearchitecture proposal before code migration begins. Made with OpenCode.

## Goal

- Update shared coding rules so day-to-day implementation guidance matches `docs/architecture/rearchitecture-proposal.md` before backend migration work starts.
- Remove ambiguity between old general standards and new backend-specific architecture constraints.

## Preconditions

- `docs/architecture/rearchitecture-proposal.md` remains canonical source for the new backend boundaries and code standards.
- Existing `.rulesync/rules/10-coding-standards.md` has been reviewed against the proposal and confirmed incomplete for rearchitecture-specific rules.

## Work Items

1. Compare current coding rules against proposal standards
   - Review `## Code Standards` in `docs/architecture/rearchitecture-proposal.md`.
   - Identify standards already covered, partially covered, or missing from `.rulesync/rules/10-coding-standards.md`.

2. Add missing backend architecture standards
   - Prefer functions over classes, with explicit repository-class exception for DB service.
   - Prefer immutability.
   - Comments explain why, not what.
   - Avoid shared state except approved service/singleton boundaries.
   - Architecture is not to be tampered with; stop and escalate on conflicts.
   - Keep parity among layers for one-operation execution paths.
   - Avoid extra patterns; follow KISS.
   - Type code explicitly; avoid `any`, limit `unknown` to boundary narrowing.
   - Test backend code under `src/server` with useful unit coverage.

3. Preserve existing repo-wide guidance where still compatible
   - Keep general KISS/DRY/composition guidance when it does not conflict with proposal rules.
   - Merge overlapping rules instead of duplicating them under different headings.

4. Clarify applicability and exceptions
   - Make clear which standards are backend-wide vs general repo guidance.
   - Document explicit exceptions called out by proposal, especially DB-service repository classes.

5. Add examples only where they reduce ambiguity
   - Prefer concise do/don't examples for standards likely to be misapplied during migration.

## Deliverables

- Updated `.rulesync/rules/10-coding-standards.md`
- Optional follow-up note in plan artifacts if any proposal rule is intentionally not transferred verbatim and why

## Verification Gate

- Proposal `## Code Standards` section fully mapped into `.rulesync/rules/10-coding-standards.md`
- No conflicting guidance remains between `.rulesync` and `docs/architecture/rearchitecture-proposal.md`
- Rule text is actionable enough to guide implementation reviews during steps 2-6

## Exit Criteria

- Missing proposal standards are added or intentionally reconciled.
- Exceptions are explicit, not implied.
- Step 2 inventory work can rely on `.rulesync` as current implementation guidance.

## Risks and Mitigations

- Risk: proposal language copied too literally and becomes repetitive or hard to apply.
  - Mitigation: consolidate overlapping rules while preserving meaning and examples.
- Risk: old generic standards silently conflict with new backend rules.
  - Mitigation: resolve contradictions in the rule file instead of appending parallel guidance.

## Roadmap / Status Impact

- `no roadmap progress impact`
