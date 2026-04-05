import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  createDraftStorageKey,
  persistDraft,
  readPersistedDraft,
  readPersistedDraftsForScope,
} from "@/client/state/draft-store.storage";
import { type DraftEnvelope, type DraftScope } from "@/client/state/draft-store.types";

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

function createEnvelope(
  scope: DraftScope,
  entityId: string,
  updatedAt: string,
): DraftEnvelope {
  return {
    scope,
    entityId,
    schemaVersion: 1,
    updatedAt,
    isDirty: true,
    data: {
      name: entityId,
    },
  };
}

describe("draft-store.storage", () => {
  beforeEach(() => {
    installStorage(new MemoryStorage());
  });

  it("discards corrupted payloads safely", () => {
    const storage = globalThis.localStorage;
    const key = createDraftStorageKey("character-create", "broken-1");

    storage.setItem(key, "{broken-json");

    const result = readPersistedDraft("character-create", "broken-1");

    assert.equal(result, null);
    assert.equal(storage.getItem(key), null);
  });

  it("discards schema-mismatched payloads safely", () => {
    const storage = globalThis.localStorage;
    const key = createDraftStorageKey("character-create", "schema-mismatch");

    storage.setItem(
      key,
      JSON.stringify({
        scope: "character-create",
        entityId: "schema-mismatch",
        schemaVersion: 999,
        updatedAt: "2026-04-04T00:00:00.000Z",
        data: { name: "Mismatch" },
        isDirty: true,
      }),
    );

    const result = readPersistedDraft("character-create", "schema-mismatch");

    assert.equal(result, null);
    assert.equal(storage.getItem(key), null);
  });

  it("keeps existing payload when incoming updatedAt is equal", () => {
    const envelope = createEnvelope(
      "character-create",
      "tie-breaker",
      "2026-04-04T10:00:00.000Z",
    );

    persistDraft(envelope);
    persistDraft({
      ...envelope,
      data: {
        name: "Updated but same timestamp",
      },
    });

    const persisted = readPersistedDraft("character-create", "tie-breaker");

    assert.ok(persisted);
    assert.equal(persisted.data.name, "tie-breaker");
  });

  it("enforces FIFO retention to 20 drafts per scope", () => {
    for (let index = 1; index <= 21; index += 1) {
      const minute = String(index).padStart(2, "0");

      persistDraft(
        createEnvelope(
          "character-create",
          `char-${index}`,
          `2026-04-04T10:${minute}:00.000Z`,
        ),
      );
    }

    const drafts = readPersistedDraftsForScope("character-create");

    assert.equal(drafts.length, 20);
    assert.equal(drafts.some((draft) => draft.entityId === "char-1"), false);
    assert.equal(drafts.some((draft) => draft.entityId === "char-21"), true);
  });
});
