import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import type { ResolveLocaleSource } from "@/i18n/resolve-locale";

type MessageCatalog = Record<string, unknown>;

export type I18nDiagnosticCategory =
  | "I18N_MESSAGES_NAMESPACE_MISSING"
  | "I18N_MESSAGES_KEY_MISSING"
  | "I18N_MESSAGES_LOAD_FAILED";

interface RequestLocaleLogInput {
  locale: SupportedLocale;
  source: ResolveLocaleSource;
  log?: (message: string) => void;
}

interface I18nDiagnosticInput {
  category: I18nDiagnosticCategory;
  locale: SupportedLocale;
  source: ResolveLocaleSource;
  namespace: string;
  keyPaths?: string[];
  log?: (message: string) => void;
}

interface ApplyMissingKeyPolicyInput {
  locale: SupportedLocale;
  source: ResolveLocaleSource;
  namespace: string;
  localeMessages: MessageCatalog;
  defaultMessages: MessageCatalog;
  isProduction: boolean;
  logDiagnostic?: (input: I18nDiagnosticInput) => void;
}

export function logResolvedRequestLocale({
  locale,
  source,
  log = console.info,
}: RequestLocaleLogInput): void {
  log(
    JSON.stringify({
      event: "i18n.locale.resolved",
      locale,
      source,
    }),
  );
}

export function logI18nDiagnostic({
  category,
  locale,
  source,
  namespace,
  keyPaths,
  log = console.warn,
}: I18nDiagnosticInput): void {
  log(
    JSON.stringify({
      event: "i18n.diagnostic",
      category,
      locale,
      source,
      namespace,
      keyPaths,
    }),
  );
}

export function applyMissingKeyPolicy({
  locale,
  source,
  namespace,
  localeMessages,
  defaultMessages,
  isProduction,
  logDiagnostic = logI18nDiagnostic,
}: ApplyMissingKeyPolicyInput): MessageCatalog {
  if (locale === DEFAULT_LOCALE) {
    return localeMessages;
  }

  const missingKeyPaths = getMissingKeyPaths(defaultMessages, localeMessages);

  if (missingKeyPaths.length === 0) {
    return localeMessages;
  }

  if (!isProduction) {
    throw new Error(
      JSON.stringify({
        category: "I18N_MESSAGES_KEY_MISSING",
        locale,
        source,
        namespace,
        keyPaths: missingKeyPaths,
      }),
    );
  }

  logDiagnostic({
    category: "I18N_MESSAGES_KEY_MISSING",
    locale,
    source,
    namespace,
    keyPaths: missingKeyPaths,
  });

  return mergeWithFallback(localeMessages, defaultMessages);
}

export function getMissingKeyPaths(
  defaultMessages: MessageCatalog,
  localeMessages: MessageCatalog,
): string[] {
  const defaultKeyPaths = collectLeafKeyPaths(defaultMessages);
  const localeKeyPaths = collectLeafKeyPaths(localeMessages);

  return [...defaultKeyPaths]
    .filter((keyPath) => !localeKeyPaths.has(keyPath))
    .sort();
}

function collectLeafKeyPaths(value: unknown, parentPath = ""): Set<string> {
  if (!isRecord(value)) {
    return parentPath ? new Set([parentPath]) : new Set();
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    return parentPath ? new Set([parentPath]) : new Set();
  }

  const keyPaths = new Set<string>();

  for (const [key, nestedValue] of entries) {
    const nextPath = parentPath ? `${parentPath}.${key}` : key;
    const nestedPaths = collectLeafKeyPaths(nestedValue, nextPath);

    for (const nestedPath of nestedPaths) {
      keyPaths.add(nestedPath);
    }
  }

  return keyPaths;
}

function mergeWithFallback(
  localeMessages: unknown,
  fallbackMessages: unknown,
): MessageCatalog {
  if (!isRecord(localeMessages) || !isRecord(fallbackMessages)) {
    return (localeMessages ?? fallbackMessages ?? {}) as MessageCatalog;
  }

  const mergedEntries: [string, unknown][] = [];
  const allKeys = new Set([
    ...Object.keys(fallbackMessages),
    ...Object.keys(localeMessages),
  ]);

  for (const key of allKeys) {
    const localeValue = localeMessages[key];
    const fallbackValue = fallbackMessages[key];

    if (localeValue === undefined) {
      mergedEntries.push([key, fallbackValue]);
      continue;
    }

    if (isRecord(localeValue) && isRecord(fallbackValue)) {
      mergedEntries.push([key, mergeWithFallback(localeValue, fallbackValue)]);
      continue;
    }

    mergedEntries.push([key, localeValue]);
  }

  return Object.fromEntries(mergedEntries);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
