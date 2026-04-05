import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../src/i18n/locales";

const REQUIRED_NAMESPACES = ["common"] as const;

type RequiredNamespace = (typeof REQUIRED_NAMESPACES)[number];

interface CatalogCheckInput {
  requiredLocales: readonly SupportedLocale[];
  requiredNamespaces: readonly RequiredNamespace[];
  defaultLocale: SupportedLocale;
  messagesRootDir: string;
}

type CatalogByNamespace = Record<RequiredNamespace, unknown>;
type CatalogByLocale = Record<SupportedLocale, CatalogByNamespace>;

export interface CatalogValidationResult {
  issues: string[];
}

export async function runCatalogCheck(
  input: CatalogCheckInput = {
    requiredLocales: SUPPORTED_LOCALES,
    requiredNamespaces: REQUIRED_NAMESPACES,
    defaultLocale: DEFAULT_LOCALE,
    messagesRootDir: path.join(process.cwd(), "messages"),
  },
): Promise<CatalogValidationResult> {
  const catalogs = await loadCatalogs(input);
  const issues = validateCatalogParity(catalogs, input.defaultLocale, input.requiredNamespaces);

  return { issues };
}

export function validateCatalogParity(
  catalogs: CatalogByLocale,
  defaultLocale: SupportedLocale,
  requiredNamespaces: readonly RequiredNamespace[],
): string[] {
  const issues: string[] = [];

  for (const namespace of requiredNamespaces) {
    const defaultMessages = catalogs[defaultLocale][namespace];
    const defaultKeys = collectMessageKeys(defaultMessages);

    for (const locale of Object.keys(catalogs) as SupportedLocale[]) {
      const localeMessages = catalogs[locale][namespace];
      const localeKeys = collectMessageKeys(localeMessages);

      const missingKeys = [...defaultKeys].filter((key) => !localeKeys.has(key));
      const extraKeys = [...localeKeys].filter((key) => !defaultKeys.has(key));

      if (missingKeys.length > 0) {
        issues.push(
          `[${locale}/${namespace}] missing keys: ${missingKeys.sort().join(", ")}`,
        );
      }

      if (extraKeys.length > 0) {
        issues.push(`[${locale}/${namespace}] extra keys: ${extraKeys.sort().join(", ")}`);
      }
    }
  }

  return issues;
}

export function collectMessageKeys(
  value: unknown,
  parentPath = "",
): Set<string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return new Set(parentPath ? [parentPath] : []);
  }

  const objectValue = value as Record<string, unknown>;
  const entries = Object.entries(objectValue);

  if (entries.length === 0) {
    return new Set(parentPath ? [parentPath] : []);
  }

  const keys = new Set<string>();

  for (const [key, nestedValue] of entries) {
    const nextPath = parentPath ? `${parentPath}.${key}` : key;
    const nestedKeys = collectMessageKeys(nestedValue, nextPath);

    for (const nestedKey of nestedKeys) {
      keys.add(nestedKey);
    }
  }

  return keys;
}

async function loadCatalogs(input: CatalogCheckInput): Promise<CatalogByLocale> {
  const localeEntries = await Promise.all(
    input.requiredLocales.map(async (locale) => {
      const namespaceEntries = await Promise.all(
        input.requiredNamespaces.map(async (namespace) => {
          const filePath = path.join(input.messagesRootDir, locale, `${namespace}.json`);
          const parsedContent = await loadJsonCatalog(filePath);

          return [namespace, parsedContent] as const;
        }),
      );

      return [locale, Object.fromEntries(namespaceEntries) as CatalogByNamespace] as const;
    }),
  );

  return Object.fromEntries(localeEntries) as CatalogByLocale;
}

async function loadJsonCatalog(filePath: string): Promise<unknown> {
  let fileContents: string;

  try {
    fileContents = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Missing catalog file: ${filePath}`, { cause: error });
  }

  try {
    return JSON.parse(fileContents) as unknown;
  } catch (error) {
    throw new Error(`Invalid JSON in catalog file: ${filePath}`, { cause: error });
  }
}

async function main() {
  try {
    const result = await runCatalogCheck();

    if (result.issues.length > 0) {
      for (const issue of result.issues) {
        console.error(`❌ ${issue}`);
      }

      process.exitCode = 1;
      return;
    }

    console.log("✅ i18n catalog parity check passed.");
  } catch (error) {
    console.error("❌ i18n catalog parity check failed.");
    console.error(error);
    process.exitCode = 1;
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  await main();
}
