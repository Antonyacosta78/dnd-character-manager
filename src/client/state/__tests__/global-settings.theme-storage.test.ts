import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  getGlobalSettingsThemeStorageKey,
  persistThemePreference,
  readPersistedThemePreference,
} from "@/client/state/global-settings.theme-storage";

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

describe("global-settings theme storage", () => {
  beforeEach(() => {
    installStorage(new MemoryStorage());
  });

  it("falls back to defaults when payload is invalid", () => {
    const key = getGlobalSettingsThemeStorageKey();

    globalThis.localStorage.setItem(key, JSON.stringify({ palette: "bad", font: "bookish" }));

    const preference = readPersistedThemePreference();

    assert.deepEqual(preference, {
      palette: "2D",
      font: "bookish",
      radius: "moderate",
    });
  });

  it("persists and rehydrates valid theme payload", () => {
    persistThemePreference({
      palette: "2B",
      font: "times",
      radius: "pronounced",
    });

    const preference = readPersistedThemePreference();

    assert.deepEqual(preference, {
      palette: "2B",
      font: "times",
      radius: "pronounced",
    });
  });

  it("throws when storage is unavailable", () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    assert.throws(
      () => {
        persistThemePreference({
          palette: "2D",
          font: "bookish",
          radius: "moderate",
        });
      },
      {
        message: "settings_theme_persistence_unavailable",
      },
    );
  });
});
