import { describe, expect, test } from "bun:test";

import {
  selectCharacterCoreBaseRevision,
  selectCharacterCoreStepBadgeStates,
} from "@/client/state/character-core-workflow.selectors";
import type { DraftEnvelope } from "@/client/state/draft-store.types";

function buildDraft(baseRevision?: number): DraftEnvelope {
  return {
    scope: "character-sheet",
    entityId: "char_1",
    schemaVersion: 1,
    updatedAt: "2026-04-05T00:00:00.000Z",
    data: {},
    isDirty: true,
    baseRevision,
  };
}

describe("selectCharacterCoreBaseRevision", () => {
  test("falls back when draft is missing", () => {
    expect(selectCharacterCoreBaseRevision(null, 3)).toBe(3);
  });

  test("uses draft revision when it is newer than fallback", () => {
    expect(selectCharacterCoreBaseRevision(buildDraft(5), 3)).toBe(5);
  });

  test("uses fallback revision when draft revision is stale", () => {
    expect(selectCharacterCoreBaseRevision(buildDraft(1), 3)).toBe(3);
  });
});

describe("selectCharacterCoreStepBadgeStates", () => {
  test("marks completed, warning, and idle states from active step and issues", () => {
    const states = selectCharacterCoreStepBadgeStates({
      stepOrder: ["core", "progression", "inventory", "spells", "notes"],
      activeStep: "inventory",
      hardIssues: [{ code: "INVALID_ITEM", path: "inventory.0.label" }],
      warnings: [
        { code: "CHARACTER_CORE_WARNING_CONCEPT_SHORT", path: "concept" },
        { code: "ACKNOWLEDGED_NOTE", path: "notes" },
      ],
      acknowledgedWarningCodes: ["ACKNOWLEDGED_NOTE"],
    });

    expect(states.core).toEqual({ status: "warning", hardIssueCount: 0, warningCount: 1 });
    expect(states.progression).toEqual({ status: "complete", hardIssueCount: 0, warningCount: 0 });
    expect(states.inventory).toEqual({ status: "warning", hardIssueCount: 1, warningCount: 0 });
    expect(states.spells).toEqual({ status: "idle", hardIssueCount: 0, warningCount: 0 });
    expect(states.notes).toEqual({ status: "idle", hardIssueCount: 0, warningCount: 0 });
  });
});
