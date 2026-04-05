export const SUPPORTED_LOCALES = ["en", "es"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_COOKIE_NAME = "dcm-locale";
export const LOCALE_STORAGE_KEY = "dcm-locale";
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

export function parseStoredLocale(
  localeValue: string | null | undefined,
): SupportedLocale | null {
  if (!localeValue) {
    return null;
  }

  const normalizedLocale = localeValue.trim().toLowerCase();

  if (!SUPPORTED_LOCALE_SET.has(normalizedLocale)) {
    return null;
  }

  return normalizedLocale as SupportedLocale;
}

export function matchSupportedLocaleCandidate(
  localeValue: string | null | undefined,
): SupportedLocale | null {
  if (!localeValue) {
    return null;
  }

  const normalizedLocale = localeValue.trim().toLowerCase();

  if (SUPPORTED_LOCALE_SET.has(normalizedLocale)) {
    return normalizedLocale as SupportedLocale;
  }

  const [baseLocale] = normalizedLocale.split("-");

  if (baseLocale && SUPPORTED_LOCALE_SET.has(baseLocale)) {
    return baseLocale as SupportedLocale;
  }

  return null;
}
