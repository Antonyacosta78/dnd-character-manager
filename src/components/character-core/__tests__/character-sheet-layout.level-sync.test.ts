import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { createCharacterSheetSaveDraft } from "@/components/character-core/character-sheet-layout";

describe("character-sheet-layout progression sync", () => {
  it("builds save draft from synced progression after finalize", () => {
    const initialProgression = {
      classRef: { name: "Fighter", source: "PHB" },
      level: 1,
    };
    const finalizedProgression = {
      classRef: { name: "Wizard", source: "PHB" },
      level: 2,
    };

    const draft = createCharacterSheetSaveDraft({
      name: "Aelar",
      concept: "Wandering protector",
      notes: "",
      inventory: [],
      spells: [],
      optionalRuleRefs: [],
      progression: finalizedProgression,
    });

    assert.equal(initialProgression.level, 1);
    assert.equal(draft.level, 2);
    assert.deepEqual(draft.classRef, finalizedProgression.classRef);
  });
});
