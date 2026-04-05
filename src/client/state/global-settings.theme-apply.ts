import type { ThemePreference } from "@/client/state/global-settings.types";

export function applyThemePreferenceToDocument(preference: ThemePreference): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  root.dataset.themePalette = preference.palette;
  root.dataset.themeFont = preference.font;
  root.dataset.themeRadius = preference.radius;
}
