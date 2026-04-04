import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  type SupportedLocale,
} from "@/i18n/locales";
import {
  applyMissingKeyPolicy,
  logI18nDiagnostic,
  logResolvedRequestLocale,
} from "@/i18n/request-policy";
import { resolveLocale } from "@/i18n/resolve-locale";

const loadCommonMessagesByLocale: Record<
  SupportedLocale,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  en: () => import("../../messages/en/common.json"),
  es: () => import("../../messages/es/common.json"),
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const isProduction = process.env.NODE_ENV === "production";

  const { locale, source } = resolveLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE_NAME)?.value,
    acceptLanguageHeader: headerStore.get("accept-language"),
  });
  logResolvedRequestLocale({ locale, source });

  const defaultCommonMessages = (await loadCommonMessagesByLocale[DEFAULT_LOCALE]())
    .default;

  let localeCommonMessages: Record<string, unknown>;

  if (locale === DEFAULT_LOCALE) {
    localeCommonMessages = defaultCommonMessages;
  } else {
    try {
      localeCommonMessages = (await loadCommonMessagesByLocale[locale]()).default;
    } catch (error) {
      if (!isProduction) {
        throw error;
      }

      logI18nDiagnostic({
        category: "I18N_MESSAGES_LOAD_FAILED",
        locale,
        source,
        namespace: "common",
      });

      localeCommonMessages = {};
    }
  }

  const commonMessages = applyMissingKeyPolicy({
    locale,
    source,
    namespace: "common",
    localeMessages: localeCommonMessages,
    defaultMessages: defaultCommonMessages,
    isProduction,
  });

  return {
    locale,
    messages: {
      common: commonMessages,
    },
  };
});
