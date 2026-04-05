import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  parseStoredLocale,
  type SupportedLocale,
} from "@/i18n/locales";
import { createLocaleCookie } from "@/i18n/client-locale-convergence";

function getStorage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }

  return globalThis.localStorage;
}

export function readInitialLocalePreference(): SupportedLocale {
  const localeFromDocument =
    typeof document === "undefined"
      ? null
      : parseStoredLocale(document.documentElement.lang);

  if (localeFromDocument) {
    return localeFromDocument;
  }

  const storage = getStorage();
  const localeFromStorage = parseStoredLocale(storage?.getItem(LOCALE_STORAGE_KEY));

  return localeFromStorage ?? DEFAULT_LOCALE;
}

export function persistLocalePreference(locale: SupportedLocale): void {
  const storage = getStorage();

  if (!storage || typeof document === "undefined") {
    throw new Error("settings_locale_update_failed");
  }

  storage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = createLocaleCookie(locale);
  document.documentElement.lang = locale;
}
