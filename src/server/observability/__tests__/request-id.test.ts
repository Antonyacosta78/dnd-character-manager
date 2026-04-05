import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { isValidRequestId, resolveRequestId } from "@/server/observability/request-id";

describe("request-id utility", () => {
  it("reuses a valid inbound request id", () => {
    const request = new Request("https://example.test/api/test", {
      headers: {
        "x-request-id": "req_from_client",
      },
    });

    const resolved = resolveRequestId(request, () => "req_generated");

    assert.equal(resolved, "req_from_client");
  });

  it("falls back when inbound request id is invalid", () => {
    const request = new Request("https://example.test/api/test", {
      headers: {
        "x-request-id": "invalid request id",
      },
    });

    const resolved = resolveRequestId(request, () => "req_generated");

    assert.equal(resolved, "req_generated");
  });

  it("validates the allowed request-id character set", () => {
    assert.equal(isValidRequestId("req-01:abc.DEF"), true);
    assert.equal(isValidRequestId(""), false);
    assert.equal(isValidRequestId("a".repeat(121)), false);
  });
});
