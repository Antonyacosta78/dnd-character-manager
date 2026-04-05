import assert from "node:assert/strict";
import { describe, it } from "bun:test";

describe("character core mobile smoke", () => {
  it("new and sheet routes are available", async () => {
    const newRoute = await import("@/app/(core)/characters/new/page");
    const sheetRoute = await import("@/app/(core)/characters/[id]/page");

    assert.equal(typeof newRoute.default, "function");
    assert.equal(typeof sheetRoute.default, "function");
  });
});
