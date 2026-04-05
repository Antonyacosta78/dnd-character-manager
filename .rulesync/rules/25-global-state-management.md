---
root: false
targets: ["*"]
description: "Global state boundaries for draft and workflow state"
globs: ["src/app/**/*", "src/components/**/*", "src/client/**/*", "src/server/**/*", "docs/architecture/global-state-management.md", "docs/specs/foundation/global-state-management-implementation-plan.md"]
opencode:
  description: "Global state boundaries for draft and workflow state"
---

# Global State Management

## Ownership Boundary

- Treat server data as canonical truth for domain entities (character, branch, world, game, snapshot, and rules-catalog derived values).
- Use global client state only for UI/workflow state and unsaved draft edits.
- Keep shareable route state in URL/search params instead of global store when possible.

## Allowed Global Store Contents

- Unsaved draft payloads and metadata (`updatedAt`, `isDirty`, scope, entity id).
- Workflow progress state (wizard steps, temporary selections, UI flow flags).
- Recoverable UI state related to draft lifecycle (restore notices, save status).

## Prohibited Patterns

- Do not move domain invariants, authorization checks, or catalog rules into client store actions.
- Do not persist auth secrets, tokens, or session credentials in local persistence.
- Do not call server adapters directly from UI/store code; use route handlers or server actions through application boundaries.
- Do not initialize global mutable stores in server component module scope.

## Mutation and Read Discipline

- Mutate store state through typed actions, not ad-hoc `setState` calls across route components.
- Prefer selector-based reads to control rerenders and keep component coupling low.
- Version persisted draft payloads and require explicit migration handling when schema changes.

## Persistence Rules (v1)

- Use local persistence for drafts with deterministic keys by scope and entity id.
- Keep retention bounded to the last 20 drafts per scope with FIFO eviction.
- Use action-based persistence triggers (field blur and explicit save/submit actions).
- Resolve local/server draft conflicts by `updatedAt` timestamp (newer wins); no conflict warning UI in v1.

## Scope Control

- If a new feature proposes additional global state categories, update architecture docs first, then update this rule.
- If state needs exceed these constraints (for example undo/redo timeline or deep orchestration), document why before expanding the store model.
