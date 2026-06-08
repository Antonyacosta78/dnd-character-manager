import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { authentication } from "@/server/middleware/api/authentication";
import { authorization } from "@/server/middleware/api/authorization";
import { schemaValidation } from "@/server/middleware/api/schema-validation";
import {
  AuthenticationMiddlewareError,
  AuthorizationMiddlewareError,
  SchemaValidationMiddlewareError,
} from "@/server/middleware/api/errors";
import { SessionServiceClass } from "@/server/services/session";

describe("API authentication middleware", () => {
  it("allows authenticated requests to proceed", async () => {
    const service = new SessionServiceClass({
      getSession: async () => ({ user: { id: "user-1" } }),
      getUserIsAdmin: async () => false,
    });

    const handler = authentication({ sessionService: service })(async () => new Response("ok"));
    const response = await handler(new Request("https://example.test/api/characters"));

    assert.equal(response.status, 200);
  });

  it("denies unauthenticated requests", async () => {
    const service = new SessionServiceClass({
      getSession: async () => null,
    });

    const handler = authentication({ sessionService: service })(async () => new Response("ok"));

    await assert.rejects(
      handler(new Request("https://example.test/api/characters")),
      (error) => error instanceof AuthenticationMiddlewareError,
    );
  });
});

describe("API authorization middleware", () => {
  it("denies access when the authorization predicate fails", async () => {
    const handler = authorization(() => false)(async () => new Response("ok"));

    await assert.rejects(
      handler(new Request("https://example.test/api/characters")),
      (error) => error instanceof AuthorizationMiddlewareError,
    );
  });
});

describe("API schema validation middleware", () => {
  it("rejects invalid input with a typed schema-validation error", async () => {
    const handler = schemaValidation((body) => {
      if (typeof (body as { username?: unknown }).username !== "string") {
        return {
          ok: false as const,
          details: {
            fields: {
              username: ["invalidType"],
            },
          },
        };
      }

      return {
        ok: true as const,
        value: body,
      };
    })(async () => new Response("ok"));

    await assert.rejects(
      handler(
        new Request("https://example.test/api/auth/register", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ username: 42 }),
        }),
      ),
      (error) => error instanceof SchemaValidationMiddlewareError,
    );
  });
});
