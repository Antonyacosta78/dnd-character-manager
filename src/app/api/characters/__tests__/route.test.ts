import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { AuthForbiddenError, AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";

import { createCharactersGetRoute } from "@/app/api/characters/route";

describe("GET /api/characters", () => {
  it("returns success envelope for owner-scoped list", async () => {
    const getRoute = createCharactersGetRoute({
      listOwnerCharacters: async () => [
        {
          id: "char-1",
          name: "Aelar",
          ownerUserId: "user-1",
          updatedAt: new Date("2026-04-05T12:00:00.000Z"),
        },
      ],
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_test_success",
    });

    const response = await getRoute(new Request("https://example.test/api/characters"));
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-request-id"), "req_test_success");
    assert.equal(payload.meta.requestId, "req_test_success");
    assert.equal(payload.meta.timestamp, "2026-04-05T12:00:00.000Z");
    assert.equal(payload.data.items.length, 1);
  });

  it("maps unauthenticated failures to AUTH_UNAUTHENTICATED / 401", async () => {
    const getRoute = createCharactersGetRoute({
      listOwnerCharacters: async () => {
        throw new AuthUnauthenticatedError();
      },
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_test_unauthenticated",
    });

    const response = await getRoute(new Request("https://example.test/api/characters"));
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.error.code, "AUTH_UNAUTHENTICATED");
    assert.equal(payload.error.status, 401);
    assert.equal(payload.meta.requestId, "req_test_unauthenticated");
  });

  it("maps forbidden failures to AUTH_FORBIDDEN / 403", async () => {
    const getRoute = createCharactersGetRoute({
      listOwnerCharacters: async () => {
        throw new AuthForbiddenError();
      },
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_test_forbidden",
    });

    const response = await getRoute(new Request("https://example.test/api/characters"));
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.error.code, "AUTH_FORBIDDEN");
    assert.equal(payload.error.status, 403);
  });

  it("maps unexpected failures to INTERNAL_ERROR / 500", async () => {
    const logs: unknown[] = [];

    const getRoute = createCharactersGetRoute({
      listOwnerCharacters: async () => {
        throw new Error("db unavailable");
      },
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_test_internal",
      logError: (entry) => {
        logs.push(entry);
      },
      captureException: () => {},
    });

    const response = await getRoute(
      new Request("https://example.test/api/characters", {
        headers: {
          "x-request-id": "req_from_client",
        },
      }),
    );
    const payload = await response.json();

    assert.equal(response.status, 500);
    assert.equal(payload.error.code, "INTERNAL_ERROR");
    assert.equal(payload.error.status, 500);
    assert.equal(payload.meta.requestId, "req_from_client");
    assert.equal(response.headers.get("x-request-id"), "req_from_client");
    assert.equal(logs.length, 1);
    assert.equal((logs[0] as { error: { code: string } }).error.code, "INTERNAL_ERROR");
  });

  it("replaces invalid inbound x-request-id values", async () => {
    const getRoute = createCharactersGetRoute({
      listOwnerCharacters: async () => [],
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_generated",
    });

    const response = await getRoute(
      new Request("https://example.test/api/characters", {
        headers: {
          "x-request-id": "bad header",
        },
      }),
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.meta.requestId, "req_generated");
    assert.equal(response.headers.get("x-request-id"), "req_generated");
  });
});
