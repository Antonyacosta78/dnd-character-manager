import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { RulesCatalogUnavailableError } from "@/server/adapters/rules-catalog/derived-rules-catalog";
import { AuthForbiddenError, AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import { CharacterRequestValidationError } from "@/server/application/errors/character-core-errors";

import { createCharactersRoute } from "@/app/api/characters/route";

describe("/api/characters", () => {
  describe("GET", () => {
    it("returns success envelope for owner-scoped list", async () => {
      const route = createCharactersRoute({
        listOwnerCharacters: async () => [
          {
            id: "char-1",
            name: "Aelar",
            ownerUserId: "user-1",
            updatedAt: new Date("2026-04-05T12:00:00.000Z"),
          },
        ],
        createCharacter: async () => {
          throw new Error("not used");
        },
        now: () => new Date("2026-04-05T12:00:00.000Z"),
        createRequestId: () => "req_test_success",
      });

      const response = await route.GET(new Request("https://example.test/api/characters"));
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("x-request-id"), "req_test_success");
      assert.equal(payload.meta.requestId, "req_test_success");
      assert.equal(payload.meta.timestamp, "2026-04-05T12:00:00.000Z");
      assert.equal(payload.data.items.length, 1);
    });

    it("maps unauthenticated failures to AUTH_UNAUTHENTICATED / 401", async () => {
      const route = createCharactersRoute({
        listOwnerCharacters: async () => {
          throw new AuthUnauthenticatedError();
        },
        createCharacter: async () => {
          throw new Error("not used");
        },
        now: () => new Date("2026-04-05T12:00:00.000Z"),
        createRequestId: () => "req_test_unauthenticated",
      });

      const response = await route.GET(new Request("https://example.test/api/characters"));
      const payload = await response.json();

      assert.equal(response.status, 401);
      assert.equal(payload.error.code, "AUTH_UNAUTHENTICATED");
      assert.equal(payload.error.status, 401);
      assert.equal(payload.meta.requestId, "req_test_unauthenticated");
    });
  });

  describe("POST", () => {
    it("returns created character envelope for valid payload", async () => {
      const route = createCharactersRoute({
        listOwnerCharacters: async () => [],
        createCharacter: async (input) => ({
          id: "char-1",
          ownerUserId: "user-1",
          name: input.draft.name,
          status: "active",
          revision: 1,
          createdAt: new Date("2026-04-05T12:00:00.000Z"),
          updatedAt: new Date("2026-04-05T12:00:00.000Z"),
          buildState: {
            concept: input.draft.concept,
            classRef: input.draft.classRef,
            level: input.draft.level,
          },
          warningOverrides: [],
        }),
        now: () => new Date("2026-04-05T12:00:00.000Z"),
        createRequestId: () => "req_test_create",
      });

      const response = await route.POST(
        new Request("https://example.test/api/characters", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            draft: {
              name: "Aelar",
              concept: "Wandering protector",
              classRef: { name: "Fighter", source: "PHB" },
              level: 1,
            },
            acknowledgedWarningCodes: [],
          }),
        }),
      );
      const payload = await response.json();

      assert.equal(response.status, 201);
      assert.equal(payload.data.character.id, "char-1");
      assert.equal(payload.meta.requestId, "req_test_create");
    });

    it("maps validation failures to REQUEST_VALIDATION_FAILED / 400", async () => {
      const route = createCharactersRoute({
        listOwnerCharacters: async () => [],
        createCharacter: async () => {
          throw new CharacterRequestValidationError({
            hardIssues: [
              {
                code: "CHARACTER_CORE_REQUIRED_NAME",
                path: "name",
                message: "Name required",
              },
            ],
          });
        },
        now: () => new Date("2026-04-05T12:00:00.000Z"),
        createRequestId: () => "req_test_validation",
      });

      const response = await route.POST(
        new Request("https://example.test/api/characters", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            draft: {
              name: "",
              concept: "",
              classRef: { name: "", source: "" },
              level: 1,
            },
          }),
        }),
      );
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.equal(payload.error.code, "REQUEST_VALIDATION_FAILED");
      assert.equal(payload.error.status, 400);
    });

    it("maps catalog unavailable to RULES_CATALOG_UNAVAILABLE / 503", async () => {
      const route = createCharactersRoute({
        listOwnerCharacters: async () => [],
        createCharacter: async () => {
          throw new RulesCatalogUnavailableError("No active catalog.");
        },
        now: () => new Date("2026-04-05T12:00:00.000Z"),
        createRequestId: () => "req_test_catalog",
      });

      const response = await route.POST(
        new Request("https://example.test/api/characters", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            draft: {
              name: "Aelar",
              concept: "Wandering protector",
              classRef: { name: "Fighter", source: "PHB" },
              level: 1,
            },
          }),
        }),
      );
      const payload = await response.json();

      assert.equal(response.status, 503);
      assert.equal(payload.error.code, "RULES_CATALOG_UNAVAILABLE");
    });

    it("maps forbidden failures to AUTH_FORBIDDEN / 403", async () => {
      const route = createCharactersRoute({
        listOwnerCharacters: async () => {
          throw new AuthForbiddenError();
        },
        createCharacter: async () => {
          throw new Error("not used");
        },
        now: () => new Date("2026-04-05T12:00:00.000Z"),
        createRequestId: () => "req_test_forbidden",
      });

      const response = await route.GET(new Request("https://example.test/api/characters"));
      const payload = await response.json();

      assert.equal(response.status, 403);
      assert.equal(payload.error.code, "AUTH_FORBIDDEN");
    });
  });
});
