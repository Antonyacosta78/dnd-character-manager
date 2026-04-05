import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import { CharacterSaveConflictError } from "@/server/application/errors/character-core-errors";
import { createSaveCharacterCanonicalUseCase } from "@/server/application/use-cases/save-character-canonical";

describe("createSaveCharacterCanonicalUseCase", () => {
  const draft = {
    name: "Aelar",
    concept: "Wandering protector",
    classRef: { name: "Fighter", source: "PHB" },
    level: 1,
  } as const;

  it("denies unauthenticated callers before repository access", async () => {
    let repositoryCalls = 0;

    const useCase = createSaveCharacterCanonicalUseCase({
      sessionContext: {
        async getSessionContext() {
          return { userId: null, isAdmin: false };
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
        async saveCanonical() {
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
            return { ref: draft.classRef, payload: {} };
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
          baseRevision: 1,
          draft: { ...draft },
          acknowledgedWarningCodes: [],
        }),
      AuthUnauthenticatedError,
    );

    assert.equal(repositoryCalls, 0);
  });

  it("throws conflict error with machine-readable revisions", async () => {
    const useCase = createSaveCharacterCanonicalUseCase({
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
          return {
            id: "char-1",
            ownerUserId: "user-1",
            name: "Aelar",
            status: "active",
            revision: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
            buildState: {
              concept: draft.concept,
              classRef: draft.classRef,
              level: 1,
            },
            warningOverrides: [],
          };
        },
        async saveCanonical() {
          return {
            kind: "conflict",
            characterId: "char-1",
            baseRevision: 2,
            serverRevision: 3,
            changedSections: ["core"],
          } as const;
        },
      },
      rulesCatalog: {
        async getDatasetVersion() {
          return { provider: "derived", fingerprint: "fp-1" };
        },
        classes: {
          async get() {
            return { ref: draft.classRef, payload: {} };
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
          draft: { ...draft },
          acknowledgedWarningCodes: [],
        }),
      (error: unknown) => {
        assert.ok(error instanceof CharacterSaveConflictError);
        assert.equal(error.details.serverRevision, 3);
        assert.deepEqual(error.details.changedSections, ["core"]);

        return true;
      },
    );
  });
});
