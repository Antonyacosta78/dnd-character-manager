import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { createRegisterPostRoute } from "@/app/api/auth/register/route";

describe("POST /api/auth/register", () => {
  it("returns success envelope for valid registration payload", async () => {
    let capturedInput: unknown;

    const postRoute = createRegisterPostRoute({
      createAccount: async (input) => {
        capturedInput = input;
        return {
          setCookieHeaders: ["better-auth.session_token=abc123; Path=/; HttpOnly"],
        };
      },
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_register_success",
    });

    const response = await postRoute(
      new Request("https://example.test/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: "darrel",
          password: "s3cret",
        }),
      }),
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.created, true);
    assert.equal(payload.meta.requestId, "req_register_success");
    assert.match(response.headers.get("set-cookie") ?? "", /better-auth\.session_token=abc123/);
    assert.deepEqual(capturedInput, {
      username: "darrel",
      password: "s3cret",
      email: null,
    });
  });

  it("maps malformed payload to REQUEST_VALIDATION_FAILED / 400", async () => {
    const postRoute = createRegisterPostRoute({
      createAccount: async () => {
        throw new Error("createAccount should not be called");
      },
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_register_invalid",
    });

    const response = await postRoute(
      new Request("https://example.test/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: 42,
          password: "",
        }),
      }),
    );
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "REQUEST_VALIDATION_FAILED");
    assert.equal(payload.error.status, 400);
    assert.deepEqual(payload.error.details.fields.username, ["invalidType"]);
  });

  it("maps duplicate username failures to REQUEST_VALIDATION_FAILED / 400", async () => {
    const postRoute = createRegisterPostRoute({
      createAccount: async () => {
        throw new Error("Unique constraint failed for username");
      },
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_register_duplicate",
    });

    const response = await postRoute(
      new Request("https://example.test/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: "taken-name",
          password: "s3cret",
        }),
      }),
    );
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "REQUEST_VALIDATION_FAILED");
    assert.equal(payload.error.status, 400);
    assert.deepEqual(payload.error.details.fields.username, ["duplicate"]);
  });

  it("maps provider/internal failures to INTERNAL_ERROR / 500", async () => {
    const logs: unknown[] = [];

    const postRoute = createRegisterPostRoute({
      createAccount: async () => {
        throw new Error("database unavailable");
      },
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_register_internal",
      logError: (entry) => {
        logs.push(entry);
      },
      captureException: () => {},
    });

    const response = await postRoute(
      new Request("https://example.test/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": "req_from_client",
        },
        body: JSON.stringify({
          username: "darrel",
          password: "s3cret",
        }),
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

  it("regenerates invalid inbound request ids", async () => {
    const postRoute = createRegisterPostRoute({
      createAccount: async () => ({
        setCookieHeaders: [],
      }),
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_generated_register",
    });

    const response = await postRoute(
      new Request("https://example.test/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": "bad header",
        },
        body: JSON.stringify({
          username: "darrel",
          password: "s3cret",
        }),
      }),
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.meta.requestId, "req_generated_register");
    assert.equal(response.headers.get("x-request-id"), "req_generated_register");
  });
});
