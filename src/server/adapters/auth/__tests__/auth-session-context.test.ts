import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuthSessionContext } from "@/server/adapters/auth/auth-session-context";

describe("AuthSessionContext", () => {
  it("returns user session context for a valid session", async () => {
    const sessionContext = new AuthSessionContext({
      getSession: async () => ({
        user: { id: "user-1" },
      }),
      findUserIsAdmin: async (userId) => userId === "user-1",
    });

    const result = await sessionContext.getSessionContext();

    assert.deepEqual(result, {
      userId: "user-1",
      isAdmin: true,
    });
  });

  it("returns signed-out fallback when there is no session", async () => {
    const sessionContext = new AuthSessionContext({
      getSession: async () => null,
      findUserIsAdmin: async () => false,
    });

    const result = await sessionContext.getSessionContext();

    assert.deepEqual(result, {
      userId: null,
      isAdmin: false,
    });
  });

  it("returns signed-out fallback on session provider failure", async () => {
    const sessionContext = new AuthSessionContext({
      getSession: async () => {
        throw new Error("session provider failed");
      },
      findUserIsAdmin: async () => false,
    });

    const result = await sessionContext.getSessionContext();

    assert.deepEqual(result, {
      userId: null,
      isAdmin: false,
    });
  });
});
