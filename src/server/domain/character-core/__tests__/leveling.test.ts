import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { buildLevelPlan, computeProficiencyBonus } from "@/server/domain/character-core/leveling";

describe("character-core leveling", () => {
  it("computes deterministic proficiency bonus", () => {
    assert.equal(computeProficiencyBonus(1), 2);
    assert.equal(computeProficiencyBonus(5), 3);
    assert.equal(computeProficiencyBonus(9), 4);
  });

  it("requires multiclass confirmation when class changes", () => {
    const plan = buildLevelPlan({
      character: {
        id: "char-1",
        ownerUserId: "user-1",
        name: "Aelar",
        status: "active",
        revision: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        buildState: {
          concept: "Wandering protector",
          classRef: { name: "Fighter", source: "PHB" },
          level: 2,
        },
        warningOverrides: [],
      },
      classRef: { name: "Wizard", source: "PHB" },
    });

    assert.equal(plan.targetLevel, 3);
    assert.equal(plan.requiresMulticlassConfirmation, true);
  });
});
