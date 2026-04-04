import {
  DEFAULT_LOCALE,
  matchSupportedLocaleCandidate,
  parseStoredLocale,
  type SupportedLocale,
} from "@/i18n/locales";

export interface ResolveLocaleInput {
  cookieLocale?: string | null;
  clientStoredLocale?: string | null;
  acceptLanguageHeader?: string | null;
}

export type ResolveLocaleSource =
  | "cookie"
  | "localStorage"
  | "accept-language"
  | "default";

export interface ResolveLocaleResult {
  locale: SupportedLocale;
  source: ResolveLocaleSource;
}

export function resolveLocale(input: ResolveLocaleInput): ResolveLocaleResult {
  const cookieLocale = parseStoredLocale(input.cookieLocale);

  if (cookieLocale) {
    return { locale: cookieLocale, source: "cookie" };
  }

  const clientStoredLocale = parseStoredLocale(input.clientStoredLocale);

  if (clientStoredLocale) {
    return { locale: clientStoredLocale, source: "localStorage" };
  }

  const headerLocale = resolveLocaleFromAcceptLanguage(input.acceptLanguageHeader);

  if (headerLocale) {
    return { locale: headerLocale, source: "accept-language" };
  }

  return { locale: DEFAULT_LOCALE, source: "default" };
}

function resolveLocaleFromAcceptLanguage(
  acceptLanguageHeader: string | null | undefined,
): SupportedLocale | null {
  if (!acceptLanguageHeader) {
    return null;
  }

  const parsedPreferences = acceptLanguageHeader
    .split(",")
    .map((entry, index) => parseLanguageEntry(entry, index))
    .filter((entry): entry is ParsedLanguageEntry => entry !== null)
    .sort((left, right) => right.quality - left.quality || left.order - right.order);

  for (const preference of parsedPreferences) {
    const matchedLocale = matchSupportedLocaleCandidate(preference.languageTag);

    if (matchedLocale) {
      return matchedLocale;
    }
  }

  return null;
}

interface ParsedLanguageEntry {
  languageTag: string;
  quality: number;
  order: number;
}

function parseLanguageEntry(
  rawEntry: string,
  order: number,
): ParsedLanguageEntry | null {
  const [rawLanguageTag, ...rawParameters] = rawEntry
    .split(";")
    .map((part) => part.trim());

  if (!rawLanguageTag) {
    return null;
  }

  const qualityParameter = rawParameters.find((parameter) =>
    parameter.startsWith("q="),
  );

  if (!qualityParameter) {
    return {
      languageTag: rawLanguageTag,
      quality: 1,
      order,
    };
  }

  const qualityValue = Number.parseFloat(qualityParameter.slice(2));

  if (!Number.isFinite(qualityValue)) {
    return null;
  }

  return {
    languageTag: rawLanguageTag,
    quality: qualityValue,
    order,
  };
}
