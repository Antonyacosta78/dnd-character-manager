# Implementation Plan: <name>

## Goal

Describe what this implementation should achieve in code and how it relates to the feature outcome.

## Related Docs

- Link the feature rundown.
- Link the relevant feature specs.
- Link any architecture notes this plan depends on.

## Existing Code References

- Link files, components, utilities, or patterns already in the app that should be reused or matched.
- Note anything that should be kept consistent with existing code.

## Files to Change

- List the files that should be updated.
- Add a short note on what changes belong in each file.

## Files to Create

- List any new files to add.
- Add a short note describing the role of each file.

## Data Flow

- Explain how data moves through the implementation.
- Include where data is created, transformed, validated, stored, and rendered.

## Types and Interfaces

- Define the main types, interfaces, or schemas that should exist.
- Include representative snippets when helpful.

```ts
// Example
interface ExampleType {
  id: string;
}
```

## Functions and Components

- List the functions, hooks, components, or modules that should be added or changed.
- For each one, describe its responsibility and inputs/outputs.

```ts
// Example
function exampleFunction(input: ExampleType): ExampleType {
  return input;
}
```

## Integration Points

- Explain where this work connects to routes, UI state, storage, import scripts, or external data.
- Mention any dependencies on other features or shared systems.

## Implementation Order

- Break the work into coding steps in the order they should be done.
- Prefer small slices that can be verified incrementally.

## Verification

- List the checks that should confirm the implementation works.
- Include test ideas, manual verification, or build/typecheck expectations.

## Notes

- Add pseudocode, code snippets, or extra guidance that will help a coding agent implement this accurately.
