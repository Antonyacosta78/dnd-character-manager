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

- Follow KISS (Keep It Simple, Stupid): prefer simple, readable solutions over clever abstractions.
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

- Refactors are cheap and should be suggested early when architecture no longer fits the use case.
- AI agents should not execute broad or opportunistic refactors without explicit user approval or request.
- By default, agents should ship the scoped feature/fix first, then propose targeted refactor follow-ups.

## Quality Baseline

- For code edits, run `bun run lint` at minimum.
- If lint cannot run, report why and list the exact verification gap.

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
