import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import {
  AuthForbiddenError,
  AuthUnauthenticatedError,
} from "@/server/application/errors/auth-errors";
import { createListOwnerCharactersUseCase } from "@/server/application/use-cases/list-owner-characters";

describe("createListOwnerCharactersUseCase", () => {
  it("denies signed-out callers before repository access", async () => {
    let repositoryCalls = 0;
    const useCase = createListOwnerCharactersUseCase({
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
      },
    });

    await assert.rejects(() => useCase(), AuthUnauthenticatedError);
    assert.equal(repositoryCalls, 0);
  });

  it("returns owner-scoped records for signed-in owner", async () => {
    const useCase = createListOwnerCharactersUseCase({
      sessionContext: {
        async getSessionContext() {
          return { userId: "user-1", isAdmin: false };
        },
      },
      characterRepository: {
        async listByOwner(ownerUserId: string) {
          return [
            {
              id: "char-1",
              name: "Aelar",
              ownerUserId,
              updatedAt: new Date("2026-04-05T12:00:00.000Z"),
            },
          ];
        },
      },
    });

    const results = await useCase();

    assert.equal(results.length, 1);
    assert.equal(results[0]?.ownerUserId, "user-1");
  });

  it("denies cross-user requests before repository access", async () => {
    let repositoryCalls = 0;
    const useCase = createListOwnerCharactersUseCase({
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
      },
    });

    await assert.rejects(() => useCase({ ownerUserId: "user-2" }), AuthForbiddenError);
    assert.equal(repositoryCalls, 0);
  });
});
