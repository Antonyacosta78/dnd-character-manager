import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  parseStoredLocale,
  type SupportedLocale,
} from "@/i18n/locales";

export interface LocaleConvergenceInput {
  cookieLocale?: string | null;
  localStorageLocale?: string | null;
}

export interface LocaleConvergenceResult {
  nextCookieLocale: SupportedLocale | null;
  shouldUpdateCookie: boolean;
}

export interface SyncClientLocalePreferenceOptions {
  getCookieHeader: () => string | null | undefined;
  getLocalStorageLocale: () => string | null | undefined;
  setCookieLocale: (locale: SupportedLocale) => void;
}

export function determineLocaleConvergence(
  input: LocaleConvergenceInput,
): LocaleConvergenceResult {
  const localStorageLocale = parseStoredLocale(input.localStorageLocale);

  if (!localStorageLocale) {
    return { nextCookieLocale: null, shouldUpdateCookie: false };
  }

  const cookieLocale = parseStoredLocale(input.cookieLocale);

  if (cookieLocale === localStorageLocale) {
    return { nextCookieLocale: null, shouldUpdateCookie: false };
  }

  return {
    nextCookieLocale: localStorageLocale,
    shouldUpdateCookie: true,
  };
}

export function syncClientLocalePreference(
  options: SyncClientLocalePreferenceOptions,
): LocaleConvergenceResult {
  const result = determineLocaleConvergence({
    cookieLocale: getCookieValue(options.getCookieHeader(), LOCALE_COOKIE_NAME),
    localStorageLocale: options.getLocalStorageLocale(),
  });

  if (result.shouldUpdateCookie && result.nextCookieLocale) {
    options.setCookieLocale(result.nextCookieLocale);
  }

  return result;
}

export function syncBrowserLocalePreference(): LocaleConvergenceResult {
  return syncClientLocalePreference({
    getCookieHeader: () => document.cookie,
    getLocalStorageLocale: () => {
      try {
        return window.localStorage.getItem(LOCALE_STORAGE_KEY);
      } catch {
        return null;
      }
    },
    setCookieLocale: (locale) => {
      document.cookie = createLocaleCookie(locale);
    },
  });
}

export function createLocaleCookie(locale: SupportedLocale): string {
  return `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function getCookieValue(
  cookieHeader: string | null | undefined,
  cookieName: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookiePrefix = `${cookieName}=`;

  for (const cookiePart of cookieHeader.split(";")) {
    const trimmedPart = cookiePart.trim();

    if (!trimmedPart.startsWith(cookiePrefix)) {
      continue;
    }

    return trimmedPart.slice(cookiePrefix.length);
  }

  return null;
}
