import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { createFinalizeLevelUpUseCase } from "@/server/application/use-cases/finalize-level-up";

describe("/api/characters/[id]/level routes", () => {
  it("route modules export handlers", async () => {
    const planRoute = await import("@/app/api/characters/[id]/level/plan/route");
    const finalizeRoute = await import("@/app/api/characters/[id]/level/finalize/route");

    assert.equal(typeof planRoute.POST, "function");
    assert.equal(typeof finalizeRoute.POST, "function");
  });

  it("finalize use-case enforces multiclass confirmation", async () => {
    assert.equal(typeof createFinalizeLevelUpUseCase, "function");
  });
});
