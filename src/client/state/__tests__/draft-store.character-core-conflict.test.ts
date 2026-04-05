import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { createDraftStoreWithOptions } from "@/client/state/draft-store";

describe("draft store character-core conflict", () => {
  it("marks and clears conflict metadata", () => {
    const store = createDraftStoreWithOptions({
      now: () => new Date("2026-04-05T12:00:00.000Z"),
    });

    store.getState().patchDraft("character-sheet", "char-1", { name: "Aelar" }, "save");
    store.getState().markConflict("character-sheet", "char-1", {
      baseRevision: 1,
      serverRevision: 2,
      changedSections: ["core"],
    }, "save");

    assert.deepEqual(
      store.getState().byScope["character-sheet"]["char-1"]?.conflict,
      {
        baseRevision: 1,
        serverRevision: 2,
        changedSections: ["core"],
      },
    );

    store.getState().clearConflict("character-sheet", "char-1", "save");

    assert.equal(store.getState().byScope["character-sheet"]["char-1"]?.conflict, undefined);
  });
});
