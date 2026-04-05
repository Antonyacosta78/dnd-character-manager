import {
  GLOBAL_SETTINGS_THEME_DEFAULTS,
  GLOBAL_THEME_FONTS,
  GLOBAL_THEME_PALETTES,
  GLOBAL_THEME_RADII,
  type ThemeFontCode,
  type ThemePaletteCode,
  type ThemePreference,
  type ThemeRadiusCode,
} from "@/client/state/global-settings.types";

const GLOBAL_SETTINGS_THEME_STORAGE_KEY = "dcm:global-settings:theme:v1";

interface ParsedThemePreference {
  palette: ThemePaletteCode | null;
  font: ThemeFontCode | null;
  radius: ThemeRadiusCode | null;
}

function getStorage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }

  return globalThis.localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseThemePalette(value: unknown): ThemePaletteCode | null {
  if (typeof value !== "string") {
    return null;
  }

  return GLOBAL_THEME_PALETTES.includes(value as ThemePaletteCode)
    ? (value as ThemePaletteCode)
    : null;
}

function parseThemeFont(value: unknown): ThemeFontCode | null {
  if (typeof value !== "string") {
    return null;
  }

  return GLOBAL_THEME_FONTS.includes(value as ThemeFontCode)
    ? (value as ThemeFontCode)
    : null;
}

function parseThemeRadius(value: unknown): ThemeRadiusCode | null {
  if (typeof value !== "string") {
    return null;
  }

  return GLOBAL_THEME_RADII.includes(value as ThemeRadiusCode)
    ? (value as ThemeRadiusCode)
    : null;
}

function parseRawThemePreference(rawValue: string): ParsedThemePreference | null {
  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!isRecord(parsed)) {
      return null;
    }

    return {
      palette: parseThemePalette(parsed.palette),
      font: parseThemeFont(parsed.font),
      radius: parseThemeRadius(parsed.radius),
    };
  } catch {
    return null;
  }
}

export function resolveThemePreferenceWithFallback(
  parsed: ParsedThemePreference | null,
): ThemePreference {
  return {
    palette: parsed?.palette ?? GLOBAL_SETTINGS_THEME_DEFAULTS.palette,
    font: parsed?.font ?? GLOBAL_SETTINGS_THEME_DEFAULTS.font,
    radius: parsed?.radius ?? GLOBAL_SETTINGS_THEME_DEFAULTS.radius,
  };
}

export function readPersistedThemePreference(): ThemePreference {
  const storage = getStorage();

  if (!storage) {
    return GLOBAL_SETTINGS_THEME_DEFAULTS;
  }

  const rawValue = storage.getItem(GLOBAL_SETTINGS_THEME_STORAGE_KEY);

  if (!rawValue) {
    return GLOBAL_SETTINGS_THEME_DEFAULTS;
  }

  const parsed = parseRawThemePreference(rawValue);

  if (!parsed) {
    storage.removeItem(GLOBAL_SETTINGS_THEME_STORAGE_KEY);
    return GLOBAL_SETTINGS_THEME_DEFAULTS;
  }

  return resolveThemePreferenceWithFallback(parsed);
}

export function persistThemePreference(preference: ThemePreference): void {
  const storage = getStorage();

  if (!storage) {
    throw new Error("settings_theme_persistence_unavailable");
  }

  storage.setItem(GLOBAL_SETTINGS_THEME_STORAGE_KEY, JSON.stringify(preference));
}

export function getGlobalSettingsThemeStorageKey(): string {
  return GLOBAL_SETTINGS_THEME_STORAGE_KEY;
}
