import assert from "node:assert/strict";
import { describe, it } from "bun:test";

describe("/api/characters/[id]/share", () => {
  it("exports PATCH handler", async () => {
    const route = await import("@/app/api/characters/[id]/share/route");

    assert.equal(typeof route.PATCH, "function");
  });
});
