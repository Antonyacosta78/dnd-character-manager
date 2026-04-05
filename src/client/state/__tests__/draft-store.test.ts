import assert from "node:assert/strict";
import { beforeEach, describe, it } from "bun:test";

import {
  createDraftStore,
  createDraftStoreWithOptions,
} from "@/client/state/draft-store";
import {
  selectDraftData,
  selectDraftEnvelope,
  selectDraftIsDirty,
  selectIsDraftStoreHydrated,
} from "@/client/state/draft-store.selectors";
import { createDraftStorageKey } from "@/client/state/draft-store.storage";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function installStorage(storage: Storage): void {
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    writable: true,
    configurable: true,
  });
}

describe("draft-store actions and selectors", () => {
  beforeEach(() => {
    installStorage(new MemoryStorage());
  });

  it("patches, reads, marks saved, and clears drafts", () => {
    const store = createDraftStore();

    store
      .getState()
      .patchDraft("character-create", "hero-1", { name: "Aelar", level: 1 });

    const stateAfterPatch = store.getState();
    assert.deepEqual(
      selectDraftData(stateAfterPatch, "character-create", "hero-1"),
      {
        name: "Aelar",
        level: 1,
      },
    );
    assert.equal(
      selectDraftIsDirty(stateAfterPatch, "character-create", "hero-1"),
      true,
    );

    store.getState().markSaved("character-create", "hero-1", "submit");

    const stateAfterSave = store.getState();
    assert.equal(
      selectDraftIsDirty(stateAfterSave, "character-create", "hero-1"),
      false,
    );

    store.getState().clearDraft("character-create", "hero-1");

    const stateAfterClear = store.getState();
    assert.equal(
      selectDraftEnvelope(stateAfterClear, "character-create", "hero-1"),
      null,
    );
  });

  it("persists only when action trigger is provided", () => {
    const store = createDraftStore();
    const key = createDraftStorageKey("character-create", "triggered-1");

    store
      .getState()
      .patchDraft("character-create", "triggered-1", { name: "No persist yet" });

    assert.equal(globalThis.localStorage.getItem(key), null);

    store
      .getState()
      .patchDraft(
        "character-create",
        "triggered-1",
        { name: "Persist on blur" },
        "blur",
      );

    assert.notEqual(globalThis.localStorage.getItem(key), null);
  });

  it("rehydrates persisted drafts and exposes hydration selector state", () => {
    const key = createDraftStorageKey("character-create", "rehydrate-1");

    globalThis.localStorage.setItem(
      key,
      JSON.stringify({
        scope: "character-create",
        entityId: "rehydrate-1",
        schemaVersion: 1,
        updatedAt: "2026-04-04T12:00:00.000Z",
        data: { name: "Restored" },
        isDirty: true,
      }),
    );

    const store = createDraftStore();

    assert.equal(selectIsDraftStoreHydrated(store.getState()), false);

    store.getState().rehydrate(["character-create"]);

    const hydratedState = store.getState();

    assert.equal(selectIsDraftStoreHydrated(hydratedState), true);
    assert.equal(
      selectDraftData(hydratedState, "character-create", "rehydrate-1")?.name,
      "Restored",
    );
  });

  it("marks draft saved even when updatedAt ties", () => {
    const now = new Date("2026-04-04T10:00:00.000Z");
    const store = createDraftStoreWithOptions({ now: () => now });

    store
      .getState()
      .patchDraft("character-create", "hero-tie", { name: "Aelar" });
    store.getState().markSaved("character-create", "hero-tie", "submit");

    const state = store.getState();

    assert.equal(selectDraftIsDirty(state, "character-create", "hero-tie"), false);
  });
});
