import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { createPrismaCharacterRepository } from "@/server/adapters/prisma/character-repository";

function createCharacterRecord() {
  const now = new Date();

  return {
    id: "char-1",
    name: "Aelar",
    ownerUserId: "user-1",
    status: "draft",
    revision: 1,
    createdAt: now,
    updatedAt: now,
    buildState: {
      concept: "Wandering protector",
      className: "Fighter",
      classSource: "PHB",
      level: 1,
      notes: null,
      optionalRuleRefsJson: "[]",
    },
    validationOverrides: [],
    inventoryEntries: [],
    spellEntries: [],
    levelHistoryEntries: [],
    shareSettings: {
      shareEnabled: false,
      shareToken: null,
      updatedAt: now,
    },
  };
}

describe("prisma character repository", () => {
  it("uses Prisma createMany envelope for validation overrides during create", async () => {
    let createArgs: Record<string, unknown> | null = null;

    const repository = createPrismaCharacterRepository({
      character: {
        async findMany() {
          return [];
        },
        async create(args: { data: Record<string, unknown> }) {
          createArgs = args;
          return createCharacterRecord();
        },
        async findFirst() {
          return null;
        },
        async updateMany() {
          return { count: 0 };
        },
        async update() {
          return createCharacterRecord();
        },
      },
      characterShareSettings: {
        async upsert() {
          return {
            shareEnabled: false,
            shareToken: null,
            updatedAt: new Date(),
          };
        },
      },
      async $transaction(callback: (tx: unknown) => Promise<unknown>) {
        return callback(this);
      },
    } as never);

    await repository.createCharacter({
      ownerUserId: "user-1",
      draft: {
        name: "Aelar",
        concept: "Wandering protector",
        classRef: { name: "Fighter", source: "PHB" },
        level: 1,
      },
      acknowledgedWarningCodes: ["CHARACTER_CORE_WARNING_CONCEPT_SHORT"],
    });

    assert.ok(createArgs);
    const data = (createArgs as { data: Record<string, unknown> }).data;
    const validationOverrides = data.validationOverrides as Record<string, unknown>;
    const createMany = validationOverrides.createMany as Record<string, unknown>;

    assert.ok(Array.isArray(createMany.data));
    assert.deepEqual(createMany.data, [{ code: "CHARACTER_CORE_WARNING_CONCEPT_SHORT", path: "core" }]);
  });

  it("uses Prisma createMany envelope for validation overrides during canonical save", async () => {
    let updateArgs: Record<string, unknown> | null = null;

    const db = {
      character: {
        async findMany() {
          return [];
        },
        async create() {
          return createCharacterRecord();
        },
        async findFirst() {
          return null;
        },
        async updateMany() {
          return { count: 1 };
        },
        async update(args: { data: Record<string, unknown> }) {
          updateArgs = args;
          return createCharacterRecord();
        },
      },
      characterShareSettings: {
        async upsert() {
          return {
            shareEnabled: false,
            shareToken: null,
            updatedAt: new Date(),
          };
        },
      },
      async $transaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T> {
        return callback(this);
      },
    };

    const repository = createPrismaCharacterRepository(db as never);

    await repository.saveCanonical({
      characterId: "char-1",
      ownerUserId: "user-1",
      baseRevision: 1,
      draft: {
        name: "Aelar",
        concept: "Wandering protector",
        classRef: { name: "Fighter", source: "PHB" },
        level: 2,
      },
      acknowledgedWarningCodes: ["CHARACTER_CORE_WARNING_CONCEPT_SHORT"],
    });

    assert.ok(updateArgs);
    const data = (updateArgs as { data: Record<string, unknown> }).data;
    const validationOverrides = data.validationOverrides as Record<string, unknown>;
    const createMany = validationOverrides.createMany as Record<string, unknown>;

    assert.ok(Array.isArray(createMany.data));
    assert.deepEqual(createMany.data, [{ code: "CHARACTER_CORE_WARNING_CONCEPT_SHORT", path: "core" }]);
  });
});
