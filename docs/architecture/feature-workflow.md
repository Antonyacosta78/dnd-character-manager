# Architecture: Feature Workflow

## Metadata

- Status: `accepted`
- Created At: `2026-03-18`
- Last Updated: `2026-04-04`
- Owner: `Antony Acosta`

## Changelog

- `2026-03-18` - `Antony Acosta` - Initial document created.
- `2026-04-04` - `Antony Acosta` - Backfilled metadata and changelog sections for lifecycle tracking. (Made with OpenCode)

## Purpose

Define how feature ideas move from rough concept to implementation-ready work, and which subagent owns each step.

## Current Plan

- Start with a feature rundown that defines the product intent.
- Review that rundown for UX gaps before technical design goes too far.
- Turn the feature into feature-specific specs and architecture updates only where needed.
- Create an implementation plan that explains exactly how the code should be written.
- Implement from the plan, then review the result for UX and architecture sanity when appropriate.

## Boundaries

- This workflow governs how feature work is documented and handed off.
- It does not define the app's runtime architecture or source parsing rules directly.
- Feature-specific details belong in `docs/features/` and `docs/specs/`.
- Shared technical rules belong in `docs/architecture/`.

## Workflow Steps

### 1. Feature Rundown

- Owner: `Libry`
- Main output: `docs/features/<feature>.md`
- Goal: define what the feature is, who it helps, and what the first useful version must include for one-shots, campaigns, or both
- Minimum contents:
  - summary
  - must have
  - nice to have
  - non-functional requirements
  - acceptance criteria
  - open questions
  - related specs and architecture links

### 2. UX Review

- Owner: `Darrel`
- Main output: updates to the feature rundown or UX-specific notes inside the relevant docs
- Goal: make sure the feature is usable, clear, and realistic in actual tabletop use
- Focus areas:
  - information hierarchy
  - player workflow
  - confusing interactions or missing UI expectations
  - mobile and desktop concerns
  - accessibility and readability

### 3. Technical Discovery and Specs

- Owner: `Stall`
- Main output:
  - `docs/specs/<feature>/*.md`
  - `docs/architecture/*.md` when shared rules are affected
- Goal: define the technical behavior, boundaries, and shared implications of the feature
- Typical spec topics:
  - data model
  - data flow
  - validation
  - UI flow
  - persistence or import behavior
  - edge cases and constraints

### 4. Implementation Plan

- Owner: `Cody`
- Main output: `docs/specs/<feature>/implementation-plan.md`
- Goal: describe exactly how the feature should be coded in the current repository
- Minimum contents:
  - related docs
  - existing code references
  - files to change
  - files to create
  - data flow
  - types and interfaces
  - functions and components
  - integration points
  - implementation order
  - verification

### 5. Implementation

- Owner: `Cody`
- Main output: code
- Goal: implement the agreed plan with small, readable changes
- Rule: if the plan collides with reality, document the deviation and explain why before continuing too far

### 6. Final Reviews

- Owner: `Darrel` for UX, `Stall` for architecture when needed
- Main output: review notes or follow-up doc updates
- Goal: confirm the implementation still matches the intended experience and has not introduced unnecessary architecture drift

## Shared Operating Protocol For Subagents

Every feature-oriented subagent should begin with the same internal structure:

1. `Questions`
   - split into `Blocking Questions` and `Non-Blocking Questions`
2. `Assumptions`
   - answer non-blocking questions with explicit defaults after reading the available context
3. `Todo`
   - create a short ordered list of work items
4. `Execution`
   - perform the task
5. `Review`
   - summarize the result, unresolved issues, and recommended next steps

Subagents should ask the user questions only when a blocking ambiguity remains after checking docs, repo context, and nearby patterns.

## Handoffs

- `Libry` hands off a completed feature rundown to `Darrel` and `Stall`.
- `Darrel` hands back UX clarifications that should be folded into the feature rundown or specs.
- `Stall` hands feature specs and architecture decisions to `Cody`.
- `Cody` hands back implementation details, plan deviations, and verification notes.
- `Darrel` and `Stall` may perform a short final review when the feature has meaningful UX or architecture impact.

## Exit Criteria By Step

- Feature rundown is ready when the feature goal, scope, acceptance criteria, and open questions are clear enough to design against.
- UX review is ready when key usability expectations and presentation concerns are explicit.
- Specs are ready when the feature's technical behavior and boundaries are clear enough to plan in code.
- Implementation plan is ready when a coding agent can identify the files, data flow, interfaces, and order of work without guessing.
- Implementation is ready when the feature matches the docs closely enough, or any differences are documented and justified.

## Related Specs

- Add links to feature-specific implementation plans or process-related specs here if they become common.

## Related Features

- This workflow applies to all feature docs created in `docs/features/`.

## Open Questions

- Whether to add a dedicated UX spec template later if Darrel's work becomes a recurring structured artifact.
- Whether to formalize discovery notes as their own document type or keep them folded into specs.
