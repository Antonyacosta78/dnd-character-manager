# Architecture: Global State Management

## Metadata

- Status: `accepted`
- Created At: `2026-04-04`
- Last Updated: `2026-04-04`
- Owner: `Antony Acosta`

## Changelog

- `2026-04-04` - `OpenCode` - Created initial architecture skeleton for global state ownership, persistence, and rollout.
- `2026-04-04` - `OpenCode` - Clarified architecture-first sequencing and moved Rulesync rule generation requirement into Current Plan.
- `2026-04-04` - `OpenCode` - Resolved autosave, retention, and conflict-handling decisions from review.
- `2026-04-04` - `OpenCode` - Added implementation-plan reference after architecture question closure.
- `2026-04-04` - `OpenCode` - Removed feature-spec placeholder and documented architecture-driven implementation rationale.

## Purpose

- Define a shared global-state strategy for Next.js App Router that supports draft-heavy DnD workflows without drifting into client-side domain duplication.
- Keep state ownership explicit so AI and human contributors do not mix server truth, UI workflow state, and route state.
- Reduce recurring risks: hydration mismatches, stale draft recovery behavior, and inconsistent persistence semantics.

## Current Plan

### Scope (v1)

- Global mutable client state is limited to UI/workflow state and unsaved draft edits.
- Canonical domain entities remain server-owned.
- Cross-tab synchronization is explicitly deferred.

### Core Decision

- Adopt `Zustand` as the v1 global client-state store.
- Use feature-scoped typed slices and action-based mutations.
- Persist drafts locally first, with server-side draft persistence as a follow-up phase.

### State Ownership Rules

- **Server truth:**
  - character, branch, world, game, snapshot records
  - rules-catalog derived domain values
  - authorization and policy decisions
- **Global client store:**
  - unsaved form/workflow drafts
  - wizard/progression UI flow state
  - dirty flags and local draft metadata
  - recoverable UI state surfaces (for example draft restore banners)
- **Route/search params:**
  - shareable URL state such as tabs, filters, and view mode
- **Component-local state:**
  - ephemeral presentation state that does not need cross-route persistence

### Store Contract (draft skeleton)

```ts
type DraftScope =
  | "character-create"
  | "progression-plan"
  | "branch-edit"
  | "snapshot-prepare";

interface DraftEnvelope<TData> {
  scope: DraftScope;
  entityId: string;
  schemaVersion: number;
  updatedAt: string;
  data: TData;
  isDirty: boolean;
}

interface DraftStore {
  rehydrate(): void;
  loadDraft(scope: DraftScope, entityId: string): void;
  patchDraft<TData>(scope: DraftScope, entityId: string, patch: Partial<TData>): void;
  clearDraft(scope: DraftScope, entityId: string): void;
  markSaved(scope: DraftScope, entityId: string): void;
}
```

Contract rules:

- Mutations happen through typed actions, not ad-hoc `setState` calls in route components.
- Selectors are the default read path to control rerender scope.
- Draft shape versioning is mandatory for persisted payload migration.

### Persistence and Sync Strategy

Phase 1 (required): local persistence

- Persist draft envelopes in `localStorage`.
- Key format: `dcm:draft:<scope>:<entityId>:v<schemaVersion>`.
- Rehydrate on client boot for active routes only.
- If persisted payload cannot be parsed or migrated, discard and emit a recoverable UI notice.
- Do not expire drafts by TTL in v1.
- Enforce max-length retention with FIFO eviction (keep last `20` drafts/edits per scope).

Phase 2 (planned): server draft persistence

- Add draft save/load use-cases in application layer.
- Add draft repository port + adapter for persistence.
- Sync policy: optimistic local-first updates with action-based save triggers.
- Initial action triggers: input blur and explicit submit/save interactions.

Conflict policy (initial)

- Use timestamp-based last-write-wins by `updatedAt`.
- Keep only the newer draft payload; do not show conflict warnings in v1.
- If timestamps are equal, keep existing persisted payload to avoid churn.

### Failure and Error Semantics

- Local rehydrate failure: fail open for UI, fail closed for invalid draft payload use.
- Save failure to server (phase 2): retain local dirty draft and show recoverable warning.
- Domain validation failure on submit: preserve draft, map errors to explicit field/state surfaces.

### Guardrails

- No domain rule evaluation inside client store actions.
- No persistence of secrets or auth/session tokens in draft storage.
- No global singleton initialized in server component module scope.
- No direct adapter calls from UI components; all persistence goes through application boundary.

### Documentation and Governance Sequence

- Refine and accept this architecture note before writing a final implementation plan.
- The implementation plan must include creation or update of a `.rulesync` global-state rule when needed.
- If no equivalent rule exists, create `.rulesync/rules/25-global-state-management.md`.
- After rule updates, run `bun run ai:generate` and `bun run ai:check`.

## Boundaries

- Governs global client-state ownership, mutation patterns, and draft persistence behavior.
- Governs how draft state interacts with route transitions and submit flows.
- Does not define domain schema for character progression features.
- Does not replace API/CLI error contract definitions.
- Does not define collaborative or realtime synchronization for v1.

## Notes

### Tradeoffs

- `Zustand` reduces ceremony and speeds early delivery, but requires explicit team discipline to avoid ad-hoc store drift.
- Local-first draft persistence improves resilience and UX immediately, but conflict semantics stay intentionally simple in v1.

### Migration Trigger to Redux Toolkit

Revisit store choice if two or more conditions are true:

- store slices become tightly coupled and hard to reason about
- undo/redo or action replay becomes a hard product requirement
- side-effect orchestration needs deterministic middleware chains across many features

### Verification Expectations

- Unit tests for store actions/selectors and persistence rehydrate behavior.
- Integration tests for draft restore after navigation/reload.
- Validation tests proving draft survives failed submit without silent data loss.

## Related Specs

- `docs/specs/design-system/foundation.md`
- `docs/specs/design-system/implementation-plan.md`
- `docs/specs/foundation/global-state-management-implementation-plan.md`

Note:

- This is an architecture-driven foundation decision, not a user-facing feature spec.
- The implementation plan exists to operationalize this architecture safely in code.

## Related Features

- Placeholder: `docs/features/character-creation.md`
- Placeholder: `docs/features/progression-planning.md`
- Placeholder: `docs/features/branching-and-timelines.md`

## Open Questions

- None currently. Add new items only when they materially affect architecture boundaries or persistence semantics.
