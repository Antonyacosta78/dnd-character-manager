import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import {
  CHARACTER_WARNING_CONCEPT_SHORT,
  CHARACTER_WARNING_CUSTOM_INVENTORY,
  validateCharacterDraftPayload,
} from "@/server/domain/character-core/character-core.validation";

describe("character-core validation", () => {
  it("returns hard issues for missing required fields", () => {
    const result = validateCharacterDraftPayload({
      name: "",
      concept: "",
      classRef: { name: "", source: "" },
      level: 2,
    });

    assert.ok(result.hardIssues.length >= 3);
  });

  it("returns warnings for short concept and custom inventory", () => {
    const result = validateCharacterDraftPayload({
      name: "Aelar",
      concept: "short",
      classRef: { name: "Fighter", source: "PHB" },
      level: 1,
      inventory: [
        {
          id: "inv-1",
          label: "Torch",
          quantity: 2,
          carriedState: "carried",
        },
      ],
    });

    assert.ok(result.warnings.some((warning) => warning.code === CHARACTER_WARNING_CONCEPT_SHORT));
    assert.ok(result.warnings.some((warning) => warning.code === CHARACTER_WARNING_CUSTOM_INVENTORY));
  });
});
