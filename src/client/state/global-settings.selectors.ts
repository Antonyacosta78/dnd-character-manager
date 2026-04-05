import type {
  GlobalSettingKey,
  GlobalSettingsStore,
  SettingFeedback,
  ThemePreference,
} from "@/client/state/global-settings.types";

export function selectIsGlobalSettingsHydrated(state: GlobalSettingsStore): boolean {
  return state.isHydrated;
}

export function selectThemePreference(state: GlobalSettingsStore): ThemePreference {
  return state.theme;
}

export function selectThemePalette(state: GlobalSettingsStore) {
  return state.theme.palette;
}

export function selectThemeFont(state: GlobalSettingsStore) {
  return state.theme.font;
}

export function selectThemeRadius(state: GlobalSettingsStore) {
  return state.theme.radius;
}

export function selectLanguage(state: GlobalSettingsStore) {
  return state.language;
}

export function selectFeedbackForSetting(
  state: GlobalSettingsStore,
  settingKey: GlobalSettingKey,
): SettingFeedback {
  return state.feedbackBySetting[settingKey];
}

export function createSettingFeedbackSelector(settingKey: GlobalSettingKey) {
  return (state: GlobalSettingsStore) => selectFeedbackForSetting(state, settingKey);
}
