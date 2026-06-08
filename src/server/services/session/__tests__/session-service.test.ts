import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { SessionResolutionError } from "@/server/services/session/errors";
import {
  SessionServiceClass,
  SIGNED_OUT_SESSION_CONTEXT,
} from "@/server/services/session";

describe("SessionServiceClass", () => {
  it("returns signed-out context when the provider has no user", async () => {
    const service = new SessionServiceClass({
      getSession: async () => null,
    });

    const result = await service.getSessionContextFromHeaders(new Headers());

    assert.deepEqual(result, SIGNED_OUT_SESSION_CONTEXT);
  });

  it("resolves authenticated caller context and caches it per request", async () => {
    let adminLookupCount = 0;

    const service = new SessionServiceClass({
      getSession: async () => ({
        user: {
          id: "user-1",
        },
      }),
      getUserIsAdmin: async () => {
        adminLookupCount += 1;
        return true;
      },
    });

    const request = new Request("https://example.test/api/characters");

    const first = await service.getSessionContextFromRequest(request);
    const second = await service.getSessionContextFromRequest(request);

    assert.deepEqual(first, { userId: "user-1", isAdmin: true });
    assert.deepEqual(second, first);
    assert.equal(adminLookupCount, 1);
  });

  it("translates provider failures into typed session-service errors", async () => {
    const service = new SessionServiceClass({
      getSession: async () => {
        throw new Error("provider offline");
      },
    });

    await assert.rejects(
      service.getSessionContextFromHeaders(new Headers()),
      (error) => error instanceof SessionResolutionError,
    );
  });
});
