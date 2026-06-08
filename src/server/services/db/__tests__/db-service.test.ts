import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { DBServiceClass } from "@/server/services/db";
import { CharacterRepository } from "@/server/services/db/characters";
import { DbTransactionError } from "@/server/services/db/errors";

describe("CharacterRepository", () => {
  it("lists characters by owner through the DB boundary", async () => {
    let capturedOwnerUserId: string | undefined;

    const repository = new CharacterRepository({
      character: {
        findMany: async (args) => {
          capturedOwnerUserId = args.where.ownerUserId;

          return [
            {
              id: "char-1",
              name: "Aelar",
              ownerUserId: args.where.ownerUserId,
              updatedAt: new Date("2026-06-07T00:00:00.000Z"),
            },
          ];
        },
      },
    });

    const result = await repository.listByOwner("user-1");

    assert.equal(capturedOwnerUserId, "user-1");
    assert.equal(result.length, 1);
    assert.equal(result[0]?.ownerUserId, "user-1");
  });
});

describe("DBServiceClass", () => {
  it("keeps transaction-scoped repositories inside the DB service boundary", async () => {
    let usedTransaction = false;

    const dbService = new DBServiceClass({
      $transaction: async (callback) =>
        callback({
          character: {
            findMany: async () => {
              usedTransaction = true;
              return [];
            },
          },
          user: {
            findUnique: async () => ({ isAdmin: false }),
          },
        }),
    } as never);

    const result = await dbService.withTransaction(async ({ characters }) =>
      characters.listByOwner("user-1"),
    );

    assert.equal(usedTransaction, true);
    assert.deepEqual(result, []);
  });

  it("translates transaction failures into typed DB service errors", async () => {
    const dbService = new DBServiceClass({
      $transaction: async () => {
        throw new Error("sqlite locked");
      },
    } as never);

    await assert.rejects(
      dbService.withTransaction(async () => []),
      (error) => error instanceof DbTransactionError,
    );
  });
});
