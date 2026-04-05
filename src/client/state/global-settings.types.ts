import type { SupportedLocale } from "@/i18n/locales";

export const GLOBAL_THEME_PALETTES = ["2A", "2B", "2C", "2D", "2E"] as const;
export const GLOBAL_THEME_FONTS = ["baseline", "serifUi", "bookish", "times"] as const;
export const GLOBAL_THEME_RADII = ["none", "subtle", "moderate", "pronounced"] as const;

export type ThemePaletteCode = (typeof GLOBAL_THEME_PALETTES)[number];
export type ThemeFontCode = (typeof GLOBAL_THEME_FONTS)[number];
export type ThemeRadiusCode = (typeof GLOBAL_THEME_RADII)[number];

export interface ThemePreference {
  palette: ThemePaletteCode;
  font: ThemeFontCode;
  radius: ThemeRadiusCode;
}

export const GLOBAL_SETTINGS_THEME_DEFAULTS: ThemePreference = {
  palette: "2D",
  font: "bookish",
  radius: "moderate",
};

export type SettingSectionKey = "appearance" | "language";

export const GLOBAL_SETTING_KEYS = [
  "theme.palette",
  "theme.font",
  "theme.radius",
  "language",
] as const;

export type GlobalSettingKey = (typeof GLOBAL_SETTING_KEYS)[number];

export type SaveFeedbackState = "idle" | "saving" | "saved" | "error";

export interface SettingFeedback {
  state: SaveFeedbackState;
  messageKey?: string;
  requestId?: number;
  updatedAtMs?: number;
}

export interface GlobalSettingsState {
  theme: ThemePreference;
  language: SupportedLocale;
  feedbackBySetting: Record<GlobalSettingKey, SettingFeedback>;
  isHydrated: boolean;
}

export interface GlobalSettingsActions {
  rehydrate(): Promise<void>;
  setThemePalette(palette: ThemePaletteCode): Promise<void>;
  setThemeFont(font: ThemeFontCode): Promise<void>;
  setThemeRadius(radius: ThemeRadiusCode): Promise<void>;
  setLanguage(locale: SupportedLocale): Promise<void>;
  resetToDefaults(): Promise<void>;
  clearFeedback(settingKey: GlobalSettingKey): void;
}

export type GlobalSettingsStore = GlobalSettingsState & GlobalSettingsActions;

export type GlobalSettingsSelector<TSelected> = (
  state: GlobalSettingsStore,
) => TSelected;
