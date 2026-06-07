---
root: false
targets: ["*"]
description: "Shared coding standards for humans and AI agents"
globs: ["**/*"]
opencode:
  description: "Shared coding standards for humans and AI agents"
---

# Coding Standards

## Core Principles

- Follow KISS (Keep It Simple, Stupid): prefer simple, readable solutions over clever abstractions or extra patterns.
- Prefer functions or function collections over classes. Only use classes when the architecture explicitly calls for them, such as DB Service repository classes.
- Prefer immutability: return new values instead of mutating existing ones unless mutation has a clear performance or clarity benefit.
- Comments should explain why a decision exists, especially for architectural or non-obvious reasoning, and should not restate what the code already says.
- If a function, file, or logic branch feels complex, split it into smaller named steps until each part is easy to reason about.
- Prefer composition over personalization: avoid wide APIs with many knobs when composed units communicate intent better.
- Follow DRY with judgment: reuse existing code when it improves clarity, but allow small repetition when abstraction would make code harder to maintain.

## Priority Order

- When principles conflict, decide in this order: Correctness > Simplicity > Readability > Performance > Reuse.

## Decision Heuristics

- Use the Rule of 3: avoid new abstractions until the third clear repetition.
- If an API needs more than one behavior flag, prefer composition or split responsibilities.
- If a function needs many optional parameters, split into focused functions and compose them.
- If behavior can be named clearly in one sentence, keep it in one unit; otherwise split by responsibility.

## Composition Guidance

- In React, avoid prop APIs that rely on multiple booleans, enums, and optional behavior flags.
- Prefer passing composed elements or focused child components when behavior variants become complex.
- Apply the same idea in non-UI code: favor small composable functions over a single function with many optional parameters.

## Refactoring Expectations

- Suggest targeted refactors early when code structure no longer fits the use case, but do not change architecture boundaries without explicit approval.
- AI agents should not execute broad or opportunistic refactors without explicit user approval or request.
- By default, agents should ship the scoped feature/fix first, then propose targeted refactor follow-ups.

## Backend Architecture Boundaries

- For backend work, the defined architecture is not to be tampered with. If the task conflicts with the architecture, stop and escalate for an explicit decision before proceeding.
- Avoid shared state. Pass operation data through parameters unless an approved service or singleton boundary is responsible for execution-scoped state; when shared state is necessary, document why, and keep that state as immutable as practical.
- Framework route files should stay as framework wiring to Entrypoint implementations; they should not mix orchestration, persistence, and error mapping directly.
- Keep one-operation execution paths aligned across layers: one externally invocable operation should map to one entrypoint, one validator, one orchestrator, and the needed Core module(s). If an operation needs multiple validators, multiple orchestrators, or unrelated Core flows, unify, split, or redesign it.
- Reuse the existing architectural patterns before inventing new ones. The backend architecture already defines Entrypoints, Orchestration, Core, Middleware, and Services; do not add ports, adapters, wrappers, or composition layers that recreate those boundaries under different names unless they solve a real problem the current structure cannot.

## Typing and Tests

- Type code explicitly. Do not use `any`, avoid `unknown`, and only use `unknown` at genuine boundaries where it is narrowed immediately into a specific type.
- Backend code under `src/server` should have useful unit coverage. Endpoint-level tests are helpful, but they do not replace unit tests for Core, Orchestration, and other backend logic.

## Quality Baseline

- For code edits, run `bun run lint` and `bun run build`; both should pass.
- If lint or build cannot run, report why and list the exact verification gap.

## React Rendering Guidance

- Minimize re-renders by placing state as close as possible to the component that uses it.
- If state only affects a child component, keep that state in the child unless shared behavior requires lifting it.
- Optimize render performance only after identifying a real hotspot (profiler evidence or user-visible lag), otherwise prefer simpler code.
- Split components by responsibility to keep rendering boundaries explicit.

## Examples

### Composition over personalization

```tsx
// Anti-example: behavior is spread across multiple control props
<ActionButton
  showTooltip
  tooltipText="Delete"
  tooltipPlacement="top"
/>

// Preferred: behavior is composed in a single explicit wrapper
<Tooltip content="Delete" placement="top">
  <ActionButton />
</Tooltip>
```

### DRY with judgment

```ts
// Anti-example: generic helper hides domain intent
async function saveRecord(
  table: "characters" | "worlds",
  payload: CharacterInput | WorldInput,
) { /* ... */ }

// Preferred: small duplication keeps intent obvious
async function saveCharacter(input: CharacterInput) { /* ... */ }
async function saveWorld(input: WorldInput) { /* ... */ }
```

### State locality for render control

```tsx
// Anti-example: parent owns state that only the child needs
function Parent() {
  const [isOpen, setIsOpen] = useState(false)
  return <Child isOpen={isOpen} onToggle={() => setIsOpen((v) => !v)} />
}

// Preferred: child owns local state when no sharing is required
function Child() {
  const [isOpen, setIsOpen] = useState(false)
  return <button onClick={() => setIsOpen((v) => !v)}>{isOpen ? "Open" : "Closed"}</button>
}
```
