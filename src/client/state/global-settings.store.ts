import { useMemo } from "react";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import { persistLocalePreference, readInitialLocalePreference } from "@/client/state/global-settings.locale-bridge";
import { applyThemePreferenceToDocument } from "@/client/state/global-settings.theme-apply";
import {
  persistThemePreference,
  readPersistedThemePreference,
} from "@/client/state/global-settings.theme-storage";
import {
  GLOBAL_SETTINGS_THEME_DEFAULTS,
  GLOBAL_SETTING_KEYS,
  GLOBAL_THEME_FONTS,
  GLOBAL_THEME_PALETTES,
  GLOBAL_THEME_RADII,
  type GlobalSettingKey,
  type GlobalSettingsActions,
  type GlobalSettingsSelector,
  type GlobalSettingsStore,
  type SaveFeedbackState,
  type SettingFeedback,
  type ThemeFontCode,
  type ThemePaletteCode,
  type ThemeRadiusCode,
} from "@/client/state/global-settings.types";
import { DEFAULT_LOCALE } from "@/i18n/locales";

const SETTING_SAVED_FEEDBACK_KEY = "designSystem.globalSettings.feedback.saved";
const SETTING_SAVE_FAILED_FEEDBACK_KEY = "designSystem.globalSettings.feedback.failed";
const FEEDBACK_CLEAR_DELAY_MS = 900;

function createFeedbackMap(): Record<GlobalSettingKey, SettingFeedback> {
  return {
    "theme.palette": { state: "idle" },
    "theme.font": { state: "idle" },
    "theme.radius": { state: "idle" },
    language: { state: "idle" },
  };
}

function createInitialState(): Pick<
  GlobalSettingsStore,
  "theme" | "language" | "feedbackBySetting" | "isHydrated"
> {
  return {
    theme: GLOBAL_SETTINGS_THEME_DEFAULTS,
    language: DEFAULT_LOCALE,
    feedbackBySetting: createFeedbackMap(),
    isHydrated: false,
  };
}

function withSettingFeedback(
  state: GlobalSettingsStore,
  settingKey: GlobalSettingKey,
  feedbackState: SaveFeedbackState,
  requestId: number,
  messageKey?: string,
): Record<GlobalSettingKey, SettingFeedback> {
  return {
    ...state.feedbackBySetting,
    [settingKey]: {
      state: feedbackState,
      requestId,
      messageKey,
      updatedAtMs: Date.now(),
    },
  };
}

interface CreateGlobalSettingsStoreOptions {
  setTimeoutImpl?: typeof setTimeout;
  clearTimeoutImpl?: typeof clearTimeout;
}

export function createGlobalSettingsStore(
  options: CreateGlobalSettingsStoreOptions = {},
) {
  const setTimeoutImpl = options.setTimeoutImpl ?? setTimeout;
  const clearTimeoutImpl = options.clearTimeoutImpl ?? clearTimeout;
  const feedbackTimers = new Map<GlobalSettingKey, ReturnType<typeof setTimeout>>();
  let requestIdCounter = 0;

  function nextRequestId(): number {
    requestIdCounter += 1;

    return requestIdCounter;
  }

  function clearFeedbackTimer(settingKey: GlobalSettingKey): void {
    const timer = feedbackTimers.get(settingKey);

    if (!timer) {
      return;
    }

    clearTimeoutImpl(timer);
    feedbackTimers.delete(settingKey);
  }

  function scheduleFeedbackClear(
    setState: (updater: (state: GlobalSettingsStore) => GlobalSettingsStore) => void,
    settingKey: GlobalSettingKey,
    requestId: number,
  ): void {
    clearFeedbackTimer(settingKey);

    const timer = setTimeoutImpl(() => {
      setState((state) => {
        if (state.feedbackBySetting[settingKey].requestId !== requestId) {
          return state;
        }

        return {
          ...state,
          feedbackBySetting: {
            ...state.feedbackBySetting,
            [settingKey]: { state: "idle" },
          },
        };
      });
      feedbackTimers.delete(settingKey);
    }, FEEDBACK_CLEAR_DELAY_MS);

    feedbackTimers.set(settingKey, timer);
  }

  return createStore<GlobalSettingsStore>((set, get) => {
    async function persistTheme(settingKey: GlobalSettingKey): Promise<void> {
      const requestId = nextRequestId();

      set((state) => ({
        ...state,
        feedbackBySetting: withSettingFeedback(
          state,
          settingKey,
          "saving",
          requestId,
        ),
      }));

      try {
        persistThemePreference(get().theme);

        set((state) => ({
          ...state,
          feedbackBySetting: withSettingFeedback(
            state,
            settingKey,
            "saved",
            requestId,
            SETTING_SAVED_FEEDBACK_KEY,
          ),
        }));
        scheduleFeedbackClear(set, settingKey, requestId);
      } catch {
        set((state) => ({
          ...state,
          feedbackBySetting: withSettingFeedback(
            state,
            settingKey,
            "error",
            requestId,
            SETTING_SAVE_FAILED_FEEDBACK_KEY,
          ),
        }));
      }
    }

    async function persistLanguage(): Promise<void> {
      const requestId = nextRequestId();

      set((state) => ({
        ...state,
        feedbackBySetting: withSettingFeedback(
          state,
          "language",
          "saving",
          requestId,
        ),
      }));

      try {
        persistLocalePreference(get().language);

        set((state) => ({
          ...state,
          feedbackBySetting: withSettingFeedback(
            state,
            "language",
            "saved",
            requestId,
            SETTING_SAVED_FEEDBACK_KEY,
          ),
        }));
        scheduleFeedbackClear(set, "language", requestId);
      } catch {
        set((state) => ({
          ...state,
          feedbackBySetting: withSettingFeedback(
            state,
            "language",
            "error",
            requestId,
            SETTING_SAVE_FAILED_FEEDBACK_KEY,
          ),
        }));
      }
    }

    const actions: GlobalSettingsActions = {
      async rehydrate() {
        const theme = readPersistedThemePreference();
        const language = readInitialLocalePreference();

        applyThemePreferenceToDocument(theme);

        set((state) => ({
          ...state,
          theme,
          language,
          isHydrated: true,
        }));
      },

      async setThemePalette(palette: ThemePaletteCode) {
        if (!GLOBAL_THEME_PALETTES.includes(palette)) {
          return;
        }

        set((state) => {
          const nextTheme = { ...state.theme, palette };
          applyThemePreferenceToDocument(nextTheme);

          return {
            ...state,
            theme: nextTheme,
          };
        });

        await persistTheme("theme.palette");
      },

      async setThemeFont(font: ThemeFontCode) {
        if (!GLOBAL_THEME_FONTS.includes(font)) {
          return;
        }

        set((state) => {
          const nextTheme = { ...state.theme, font };
          applyThemePreferenceToDocument(nextTheme);

          return {
            ...state,
            theme: nextTheme,
          };
        });

        await persistTheme("theme.font");
      },

      async setThemeRadius(radius: ThemeRadiusCode) {
        if (!GLOBAL_THEME_RADII.includes(radius)) {
          return;
        }

        set((state) => {
          const nextTheme = { ...state.theme, radius };
          applyThemePreferenceToDocument(nextTheme);

          return {
            ...state,
            theme: nextTheme,
          };
        });

        await persistTheme("theme.radius");
      },

      async setLanguage(locale) {
        set((state) => ({
          ...state,
          language: locale,
        }));

        await persistLanguage();
      },

      async resetToDefaults() {
        set((state) => {
          applyThemePreferenceToDocument(GLOBAL_SETTINGS_THEME_DEFAULTS);

          return {
            ...state,
            theme: GLOBAL_SETTINGS_THEME_DEFAULTS,
            language: DEFAULT_LOCALE,
          };
        });

        await Promise.all([
          persistTheme("theme.palette"),
          persistTheme("theme.font"),
          persistTheme("theme.radius"),
          persistLanguage(),
        ]);
      },

      clearFeedback(settingKey) {
        clearFeedbackTimer(settingKey);

        set((state) => ({
          ...state,
          feedbackBySetting: {
            ...state.feedbackBySetting,
            [settingKey]: { state: "idle" },
          },
        }));
      },
    };

    return {
      ...createInitialState(),
      ...actions,
    };
  });
}

export const globalSettingsStore = createGlobalSettingsStore();

export function useGlobalSettings<TSelected>(
  selector: GlobalSettingsSelector<TSelected>,
): TSelected {
  return useStore(globalSettingsStore, selector);
}

export function useGlobalSettingsActions(): GlobalSettingsActions {
  const rehydrate = useGlobalSettings((state) => state.rehydrate);
  const setThemePalette = useGlobalSettings((state) => state.setThemePalette);
  const setThemeFont = useGlobalSettings((state) => state.setThemeFont);
  const setThemeRadius = useGlobalSettings((state) => state.setThemeRadius);
  const setLanguage = useGlobalSettings((state) => state.setLanguage);
  const resetToDefaults = useGlobalSettings((state) => state.resetToDefaults);
  const clearFeedback = useGlobalSettings((state) => state.clearFeedback);

  return useMemo(
    () => ({
      rehydrate,
      setThemePalette,
      setThemeFont,
      setThemeRadius,
      setLanguage,
      resetToDefaults,
      clearFeedback,
    }),
    [
      clearFeedback,
      rehydrate,
      resetToDefaults,
      setLanguage,
      setThemeFont,
      setThemePalette,
      setThemeRadius,
    ],
  );
}

export function getGlobalSettingsStoreState(): GlobalSettingsStore {
  return globalSettingsStore.getState();
}

export function getGlobalSettingsFeedbackClearDelayMs(): number {
  return FEEDBACK_CLEAR_DELAY_MS;
}

export function getGlobalSettingsFeedbackSavedKey(): string {
  return SETTING_SAVED_FEEDBACK_KEY;
}

export function getGlobalSettingsFeedbackFailedKey(): string {
  return SETTING_SAVE_FAILED_FEEDBACK_KEY;
}

export function getGlobalSettingsKeys(): readonly GlobalSettingKey[] {
  return GLOBAL_SETTING_KEYS;
}
