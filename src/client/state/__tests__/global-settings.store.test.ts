import assert from "node:assert/strict";
import { beforeEach, describe, it } from "bun:test";

import {
  createGlobalSettingsStore,
  getGlobalSettingsFeedbackSavedKey,
} from "@/client/state/global-settings.store";

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

interface DocumentMock {
  cookie: string;
  documentElement: {
    lang: string;
    dataset: Record<string, string>;
  };
}

function installStorage(storage: Storage): void {
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    writable: true,
    configurable: true,
  });
}

function installDocument(documentMock: DocumentMock): void {
  Object.defineProperty(globalThis, "document", {
    value: documentMock,
    writable: true,
    configurable: true,
  });
}

describe("global-settings store", () => {
  beforeEach(() => {
    installStorage(new MemoryStorage());
    installDocument({
      cookie: "",
      documentElement: {
        lang: "en",
        dataset: {},
      },
    });
  });

  it("rehydrates and applies persisted theme + locale", async () => {
    globalThis.localStorage.setItem(
      "dcm:global-settings:theme:v1",
      JSON.stringify({ palette: "2A", font: "serifUi", radius: "none" }),
    );

    const store = createGlobalSettingsStore();

    await store.getState().rehydrate();

    const state = store.getState();

    assert.equal(state.isHydrated, true);
    assert.deepEqual(state.theme, {
      palette: "2A",
      font: "serifUi",
      radius: "none",
    });
    assert.equal(state.language, "en");
    assert.equal(globalThis.document.documentElement.dataset.themePalette, "2A");
    assert.equal(globalThis.document.documentElement.dataset.themeFont, "serifUi");
    assert.equal(globalThis.document.documentElement.dataset.themeRadius, "none");
  });

  it("writes theme settings with saved feedback", async () => {
    const store = createGlobalSettingsStore();

    await store.getState().setThemePalette("2E");

    const state = store.getState();

    assert.equal(state.theme.palette, "2E");
    assert.equal(state.feedbackBySetting["theme.palette"].state, "saved");
    assert.equal(
      state.feedbackBySetting["theme.palette"].messageKey,
      getGlobalSettingsFeedbackSavedKey(),
    );
  });

  it("uses latest selection for rapid updates", async () => {
    const store = createGlobalSettingsStore();

    await Promise.all([
      store.getState().setThemePalette("2B"),
      store.getState().setThemePalette("2C"),
    ]);

    const state = store.getState();

    assert.equal(state.theme.palette, "2C");
  });

  it("marks language save as error when locale persistence fails", async () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const store = createGlobalSettingsStore();

    await store.getState().setLanguage("es");

    const state = store.getState();

    assert.equal(state.language, "es");
    assert.equal(state.feedbackBySetting.language.state, "error");
  });
});
