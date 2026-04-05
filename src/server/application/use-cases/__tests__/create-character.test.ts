import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { CharacterRequestValidationError } from "@/server/application/errors/character-core-errors";
import { createCreateCharacterUseCase } from "@/server/application/use-cases/create-character";

describe("createCreateCharacterUseCase", () => {
  it("enforces level-one rule during initial character creation", async () => {
    let repositoryCalls = 0;

    const useCase = createCreateCharacterUseCase({
      sessionContext: {
        async getSessionContext() {
          return { userId: "user-1", isAdmin: false };
        },
      },
      characterRepository: {
        async listByOwner() {
          repositoryCalls += 1;
          return [];
        },
        async createCharacter() {
          repositoryCalls += 1;
          throw new Error("not used");
        },
        async getByIdForOwner() {
          repositoryCalls += 1;
          return null;
        },
        async getByShareToken() {
          repositoryCalls += 1;
          return null;
        },
        async saveCanonical() {
          repositoryCalls += 1;
          throw new Error("not used");
        },
        async finalizeLevelUp() {
          repositoryCalls += 1;
          throw new Error("not used");
        },
        async setShareEnabled() {
          repositoryCalls += 1;
          throw new Error("not used");
        },
      },
      rulesCatalog: {
        async getDatasetVersion() {
          return { provider: "derived", fingerprint: "fp-1" };
        },
        classes: {
          async get() {
            return { ref: { name: "Fighter", source: "PHB" }, payload: {} };
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
          draft: {
            name: "Aelar",
            concept: "Wandering protector",
            classRef: { name: "Fighter", source: "PHB" },
            level: 2,
          },
          acknowledgedWarningCodes: [],
        }),
      (error: unknown) => {
        assert.ok(error instanceof CharacterRequestValidationError);
        assert.ok(
          error.details.hardIssues?.some((issue) => issue.code === "CHARACTER_CORE_LEVEL_ONE_REQUIRED"),
        );

        return true;
      },
    );

    assert.equal(repositoryCalls, 0);
  });
});
