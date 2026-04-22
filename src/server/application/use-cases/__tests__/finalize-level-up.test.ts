import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { CharacterRequestValidationError } from "@/server/application/errors/character-core-errors";
import { createFinalizeLevelUpUseCase } from "@/server/application/use-cases/finalize-level-up";

describe("createFinalizeLevelUpUseCase", () => {
  const character = {
    id: "char-1",
    ownerUserId: "user-1",
    name: "Aelar",
    status: "active",
    revision: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    buildState: {
      concept: "Wandering protector",
      classRef: { name: "Fighter", source: "PHB" },
      level: 2,
    },
    warningOverrides: [],
  };

  it("requires confirmation for multiclass finalize", async () => {
    const useCase = createFinalizeLevelUpUseCase({
      sessionContext: {
        async getSessionContext() {
          return { userId: "user-1", isAdmin: false };
        },
      },
      characterRepository: {
        async listByOwner() {
          return [];
        },
        async createCharacter() {
          throw new Error("not used");
        },
        async getByIdForOwner() {
          return character;
        },
        async getByShareToken() {
          return null;
        },
        async saveCanonical() {
          throw new Error("not used");
        },
        async finalizeLevelUp() {
          throw new Error("not used");
        },
        async setShareEnabled() {
          throw new Error("not used");
        },
      },
      rulesCatalog: {
        async getDatasetVersion() {
          return { provider: "derived", fingerprint: "fp-1" };
        },
        classes: {
          async get() {
            return { ref: { name: "Wizard", source: "PHB" }, payload: {} };
          },
          async list() {
            return [];
          },
        },
        subclasses: {
          async get() {
            return null;
          },
          async listByClass() {
            return [];
          },
        },
        races: { async get() { return null; }, async list() { return []; } },
        backgrounds: { async get() { return null; }, async list() { return []; } },
        spells: { async get() { return null; }, async list() { return []; } },
        feats: { async get() { return null; }, async list() { return []; } },
        features: { async resolve() { return null; } },
      },
    });

    await assert.rejects(
      () =>
        useCase({
          characterId: "char-1",
          baseRevision: 2,
          classRef: { name: "Wizard", source: "PHB" },
        }),
      CharacterRequestValidationError,
    );
  });
});
