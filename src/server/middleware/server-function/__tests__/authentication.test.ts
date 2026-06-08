import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { AuthenticationMiddlewareError } from "@/server/middleware/server-function/errors";
import { withAuthentication } from "@/server/middleware/server-function/authentication";
import { SessionServiceClass } from "@/server/services/session";

describe("server-function authentication middleware", () => {
  it("passes authenticated context to the handler", async () => {
    const service = new SessionServiceClass({
      getSession: async () => ({ user: { id: "user-1" } }),
      getUserIsAdmin: async () => true,
    });

    const handler = withAuthentication(
      async (_input, context) => context?.sessionContext,
      { sessionService: service },
    );

    const result = await handler(undefined, { requestHeaders: new Headers() });

    assert.deepEqual(result, { userId: "user-1", isAdmin: true });
  });

  it("rejects unauthenticated execution", async () => {
    const service = new SessionServiceClass({
      getSession: async () => null,
    });

    const handler = withAuthentication(async () => "ok", {
      sessionService: service,
    });

    await assert.rejects(
      handler(undefined, { requestHeaders: new Headers() }),
      (error) => error instanceof AuthenticationMiddlewareError,
    );
  });
});
