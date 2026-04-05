import { getLocale, getTranslations } from "next-intl/server";

import { DraftStoreDemo } from "@/app/draft-store-demo";

export default async function Home() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("common"),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-16 font-sans sm:px-10">
      <p className="text-sm text-zinc-500">{t("appName")}</p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        {t("homeTitle")}
      </h1>
      <p className="max-w-2xl text-base text-zinc-600">{t("homeDescription")}</p>
      <dl className="grid gap-2 text-sm text-zinc-700">
        <div className="flex gap-2">
          <dt className="font-medium">{t("activeLocaleLabel")}:</dt>
          <dd>{locale}</dd>
        </div>
        <div>
          <dt className="sr-only">{t("supportedLocalesLabel")}</dt>
          <dd>{t("supportedLocalesLabel")}</dd>
        </div>
      </dl>

      <DraftStoreDemo />
    </main>
  );
}
