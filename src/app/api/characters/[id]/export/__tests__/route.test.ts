import assert from "node:assert/strict";
import { describe, it } from "bun:test";

describe("/api/characters/[id]/export", () => {
  it("exports GET handler", async () => {
    const route = await import("@/app/api/characters/[id]/export/route");

    assert.equal(typeof route.GET, "function");
  });
});
