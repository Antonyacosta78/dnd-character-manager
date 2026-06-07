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

## Backend Code Standards

- These standards apply to all backend code in the repository.
- This document is the canonical source for these backend standards.
- `docs/architecture/rearchitecture-proposal.md` is supporting architecture history and rationale, not the live source of truth.
- The wiggle room for each rule is described in the rule itself. If work still conflicts with the defined architecture after applying that wiggle room, stop and escalate before proceeding.

### Prefer functions over classes

Functions are the first choice for backend operations because they are easier to maintain and keep focused on a single responsibility. Use functions or function collections before classes when there is no clear advantage to a class.

- Use plain functions for Core and Orchestration operations.
- Do not introduce classes for ordinary operations when a function is enough.
- Classes are still acceptable where the architecture explicitly calls for them, such as DB Service repository classes.

```ts
export interface CreateCharacterInput {
  name: string;
  ancestryId: string;
  classId: string;
}

export async function createCharacterOrchestrator(
  input: CreateCharacterInput,
): Promise<OperationResult<Character>> {
  const ancestry = await DBService.ancestries.findById(input.ancestryId);

  if (!ancestry) {
    throw new RecordNotFoundError({
      code: "CHARACTER_ANCESTRY_NOT_FOUND",
      entity: "orchestration",
      status: 404,
      exitCode: 1,
      message: "The selected ancestry does not exist.",
    });
  }

  const result = createCharacterCore({
    name: input.name,
    ancestry,
    classId: input.classId,
  });

  return DBService.characters.create(result);
}

export class CreateCharacterUseCase {
  async execute(input: CreateCharacterInput): Promise<Character> {
    const ancestry = await DBService.ancestries.findById(input.ancestryId);

    if (!ancestry) {
      throw new Error("Ancestry not found");
    }

    const result = createCharacterCore({
      name: input.name,
      ancestry,
      classId: input.classId,
    });

    return DBService.characters.create(result);
  }
}
```

### Prefer immutability

Avoid mutating variables and objects in place because immutability makes data flow easier to trace. Mutation is only acceptable when immutability would cause a meaningful performance downside or make the data flow harder to understand.

- Create new values when transforming data.
- Do not mutate existing values in place when a new value can be returned clearly.

```ts
export function applyLevelUp(
  character: Character,
  levelUp: LevelUpResult,
): Character {
  return {
    ...character,
    level: character.level + 1,
    maxHp: character.maxHp + levelUp.hpIncrease,
    features: [...character.features, ...levelUp.newFeatures],
  };
}

export function applyLevelUpMutable(
  character: Character,
  levelUp: LevelUpResult,
): Character {
  character.level += 1;
  character.maxHp += levelUp.hpIncrease;
  character.features.push(...levelUp.newFeatures);

  return character;
}
```

### Code comments: "Why" instead of "what"

Backend code should usually be clear enough to read without comments. Use comments to explain architectural or non-obvious reasoning. Do not use comments to restate what the code already says.

```ts
// Session context is stored through Session Service because middleware
// must not own request-scoped caller state directly.
await SessionService.bindCurrentSession(session);

// Gets the current session.
const activeSession = await SessionService.getCurrentSession();

// Checks if the session does not exist.
if (!activeSession) {
  throw new AuthenticationRequiredError();
}
```

### Avoid shared state

Shared state is harder to track than explicit inputs and outputs.

- Pass required operation data through parameters when possible.
- Do not rely on mutable module-level state for operation data.
- If shared state is required for execution-scoped context, keep it inside the appropriate service or singleton boundary, such as Session Service.
- When shared state is necessary, add a comment that explains why that boundary is required.
- Even approved state-propagation services should follow the immutability rule as much as practical.

```ts
export function canEditCharacter(input: {
  characterOwnerId: string;
  callerUserId: string;
}): boolean {
  return input.characterOwnerId === input.callerUserId;
}

let currentUserId: string | undefined;

export function setCurrentUserId(userId: string): void {
  currentUserId = userId;
}

export function canEditCharacterFromSharedState(
  characterOwnerId: string,
): boolean {
  return characterOwnerId === currentUserId;
}
```

### Architecture is not to be tampered with

The defined architecture is the main structure for backend work.

- Do not deviate from the architecture because it feels faster in the moment.
- If work cannot be accomplished within the architecture, stop, explain the conflict, and do not proceed until there is explicit approval or a redirection plan.
- Framework route files must stay as framework wiring to Entrypoint implementations. They must not become the place where orchestration, persistence, and error mapping are mixed together.

```ts
// Do not proceed with this implementation as-is.
// This feature requires the Entrypoint Layer to call DB Service directly for
// business data loading, which violates the current boundary rules.
// The implementation needs an approved orchestration operation first.

// src/app/api/characters/route.ts
export async function POST(request: Request): Promise<Response> {
  const body = await request.json();

  const existingCharacter = await prisma.character.findFirst({
    where: { name: body.name },
  });

  if (existingCharacter) {
    return Response.json({ error: "Character already exists" }, { status: 409 });
  }

  const character = await prisma.character.create({
    data: body,
  });

  return Response.json(character);
}
```

### Keep parity among layers

One externally invocable operation should have one validator, one orchestrator, and one or more related Core modules.

- Keep one operation aligned across entrypoint, validation, orchestration, and Core boundaries.
- If an endpoint needs more than one validator, unify them.
- If an endpoint needs more than one orchestrator, it is likely doing too much.
- If an endpoint needs several unrelated Core functions, split or redesign it.

```text
src/server/entrypoint/api/characters/create.ts
src/server/middleware/api/schema-validation/create-character.ts
src/server/orchestration/character/create.ts
src/server/core/character/create.ts
```

```ts
export async function POST(request: Request): Promise<Response> {
  const body = await request.json();

  const character = await createCharacterOrchestrator(body.character);
  await createStartingInventoryOrchestrator(body.inventory);
  await createCampaignMembershipOrchestrator(body.campaign);
  await sendCharacterCreatedNotificationOrchestrator(character.id);

  return Response.json(character);
}
```

### Avoid introducing extra patterns, follow KISS

Introducing new patterns creates noise and code smell.

- Reuse the patterns already present in the backend architecture when they are sufficient.
- Scan the project before inventing a new abstraction.
- The backend architecture already defines Entrypoints, Orchestration, Core, Middleware, and Services.
- Do not recreate those boundaries through extra ports, adapters, wrappers, or composition layers under different names unless they solve a real problem the current structure cannot.

```ts
export async function listCharactersOrchestrator(): Promise<
  OperationResult<CharacterSummary[]>
> {
  return DBService.characters.listSummaries();
}

interface CharacterQueryPort {
  listSummaries(): Promise<CharacterSummary[]>;
}

class CharacterQueryAdapter implements CharacterQueryPort {
  async listSummaries(): Promise<CharacterSummary[]> {
    return DBService.characters.listSummaries();
  }
}

class ListCharactersUseCase {
  constructor(private readonly characterQueryPort: CharacterQueryPort) {}

  async execute(): Promise<CharacterSummary[]> {
    return this.characterQueryPort.listSummaries();
  }
}
```

### Type your code

All backend code should have explicit typing.

- Do not use `any`.
- Avoid `unknown`.
- Only use `unknown` when a value is genuinely unknown at a boundary and is narrowed immediately into a specific type.
- Define explicit input and output contracts instead of vague object shapes.

```ts
export interface CreateCharacterCoreInput {
  name: string;
  ancestry: Ancestry;
  characterClass: CharacterClass;
}

export interface CreateCharacterCoreResult {
  name: string;
  ancestryId: string;
  classId: string;
  startingHp: number;
}

export function createCharacterCore(
  input: CreateCharacterCoreInput,
): CreateCharacterCoreResult {
  return {
    name: input.name,
    ancestryId: input.ancestry.id,
    classId: input.characterClass.id,
    startingHp: input.characterClass.baseHp + input.ancestry.hpBonus,
  };
}

export function createCharacterCoreUnsafe(input: any): any {
  return {
    name: input.name,
    ancestryId: input.ancestry.id,
    classId: input.characterClass.id,
    startingHp: input.characterClass.baseHp + input.ancestry.hpBonus,
  };
}
```

### Test your code

As a rule of thumb, everything under `src/server` should have useful unit testing.

- Test Core functions as pure business logic.
- Test Orchestration by mocking services and verifying operation-level behavior.
- Endpoint-level tests are useful, but they do not replace unit tests for backend code under `src/server`.

```ts
describe("createCharacterCore", () => {
  it("calculates starting HP from class base HP and ancestry bonus", () => {
    const result = createCharacterCore({
      name: "Aldren",
      ancestry: {
        id: "human",
        hpBonus: 2,
      },
      characterClass: {
        id: "fighter",
        baseHp: 10,
      },
    });

    expect(result).toEqual({
      name: "Aldren",
      ancestryId: "human",
      classId: "fighter",
      startingHp: 12,
    });
  });
});

describe("createCharacterOrchestrator", () => {
  it("throws an orchestration NotFound error when the ancestry does not exist", async () => {
    vi.spyOn(DBService.ancestries, "findById").mockResolvedValue(null);

    await expect(
      createCharacterOrchestrator({
        name: "Aldren",
        ancestryId: "missing-ancestry",
        classId: "fighter",
      }),
    ).rejects.toBeInstanceOf(CharacterAncestryNotFoundError);
  });
});

describe("POST /api/characters", () => {
  it("creates a character", async () => {
    const response = await fetch("/api/characters", {
      method: "POST",
      body: JSON.stringify({
        name: "Aldren",
        ancestryId: "human",
        classId: "fighter",
      }),
    });

    expect(response.status).toBe(200);
  });
});
```

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
