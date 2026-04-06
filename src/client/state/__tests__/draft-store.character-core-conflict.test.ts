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

  it("keeps create->save revision metadata synchronized", () => {
    const store = createDraftStoreWithOptions({
      now: () => new Date("2026-04-05T12:30:00.000Z"),
    });

    store.getState().patchDraft("character-create", "new-character", { name: "Aelar" }, "blur");
    store.getState().patchDraft("character-create", "char-42", { name: "Aelar" }, "submit");
    store.getState().markSaved("character-create", "char-42", "submit");
    store.getState().setBaseRevision("character-create", "char-42", 7, "submit");
    store.getState().clearDraft("character-create", "new-character");

    assert.equal(store.getState().byScope["character-create"]["new-character"], undefined);
    assert.equal(store.getState().byScope["character-create"]["char-42"]?.isDirty, false);
    assert.equal(store.getState().byScope["character-create"]["char-42"]?.baseRevision, 7);
  });

  it("keeps sheet save metadata synchronized", () => {
    const store = createDraftStoreWithOptions({
      now: () => new Date("2026-04-05T13:00:00.000Z"),
    });

    store.getState().patchDraft("character-sheet", "char-7", { notes: "Updated" }, "save");
    store.getState().markSaved("character-sheet", "char-7", "save");
    store.getState().setBaseRevision("character-sheet", "char-7", 11, "save");

    assert.equal(store.getState().byScope["character-sheet"]["char-7"]?.isDirty, false);
    assert.equal(store.getState().byScope["character-sheet"]["char-7"]?.baseRevision, 11);
    assert.equal(store.getState().byScope["character-sheet"]["char-7"]?.conflict, undefined);
  });
});
