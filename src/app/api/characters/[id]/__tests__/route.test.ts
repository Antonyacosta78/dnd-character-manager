import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { CharacterNotFoundError, CharacterSaveConflictError } from "@/server/application/errors/character-core-errors";

import { createCharacterByIdRoute } from "@/app/api/characters/[id]/route";

describe("/api/characters/[id]", () => {
  it("returns character aggregate on GET success", async () => {
    const route = createCharacterByIdRoute({
      getOwnerCharacterById: async () => ({
        id: "char-1",
        ownerUserId: "user-1",
        name: "Aelar",
        status: "active",
        revision: 2,
        createdAt: new Date("2026-04-05T12:00:00.000Z"),
        updatedAt: new Date("2026-04-05T12:00:00.000Z"),
        buildState: {
          concept: "Wandering protector",
          classRef: { name: "Fighter", source: "PHB" },
          level: 1,
        },
        warningOverrides: [],
      }),
      saveCharacterCanonical: async () => {
        throw new Error("not used");
      },
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_test_get_by_id",
    });

    const response = await route.GET(
      new Request("https://example.test/api/characters/char-1"),
      { params: Promise.resolve({ id: "char-1" }) },
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.character.id, "char-1");
    assert.equal(payload.meta.requestId, "req_test_get_by_id");
  });

  it("maps revision conflicts to REQUEST_VALIDATION_FAILED with conflict details", async () => {
    const route = createCharacterByIdRoute({
      getOwnerCharacterById: async () => {
        throw new Error("not used");
      },
      saveCharacterCanonical: async () => {
        throw new CharacterSaveConflictError({
          characterId: "char-1",
          baseRevision: 2,
          serverRevision: 3,
          changedSections: ["core"],
          draft: {
            name: "Aelar",
            concept: "Wandering protector",
            classRef: { name: "Fighter", source: "PHB" },
            level: 1,
          },
        });
      },
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_test_conflict",
    });

    const response = await route.PATCH(
      new Request("https://example.test/api/characters/char-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          baseRevision: 2,
          draft: {
            name: "Aelar",
            concept: "Wandering protector",
            classRef: { name: "Fighter", source: "PHB" },
            level: 1,
          },
          acknowledgedWarningCodes: [],
        }),
      }),
      { params: Promise.resolve({ id: "char-1" }) },
    );

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "REQUEST_VALIDATION_FAILED");
    assert.equal(payload.error.details.conflict.serverRevision, 3);
  });

  it("maps not found to REQUEST_VALIDATION_FAILED", async () => {
    const route = createCharacterByIdRoute({
      getOwnerCharacterById: async () => {
        throw new CharacterNotFoundError();
      },
      saveCharacterCanonical: async () => {
        throw new Error("not used");
      },
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_test_not_found",
    });

    const response = await route.GET(
      new Request("https://example.test/api/characters/missing"),
      { params: Promise.resolve({ id: "missing" }) },
    );
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "REQUEST_VALIDATION_FAILED");
  });
});
