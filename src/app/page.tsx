import { getLocale, getTranslations } from "next-intl/server";

import { AppIcon } from "@/components/domain/rune-icon";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("common"),
  ]);
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-16 font-ui sm:px-10">
      <p className="text-sm text-fg-muted">{t("appName")}</p>
      <h1 className="font-display text-3xl tracking-tight text-fg-primary">{t("designSystem.home.title")}</h1>
      <p className="max-w-2xl text-base text-fg-secondary">{t("designSystem.home.description")}</p>
      <dl className="grid gap-2 text-sm text-fg-secondary">
        <div className="flex gap-2">
          <dt className="font-medium">{t("activeLocaleLabel")}:</dt>
          <dd>{locale}</dd>
        </div>
        <div>
          <dt className="sr-only">{t("supportedLocalesLabel")}</dt>
          <dd>{t("supportedLocalesLabel")}</dd>
        </div>
      </dl>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button as="a" href="/workbench" intent="primary" className="w-full justify-between">
          <span>{t("designSystem.surface.workbench")}</span>
          <AppIcon name="workbench" label={t("designSystem.surface.workbench")} />
        </Button>
        <Button as="a" href="/codex" intent="neutral" className="w-full justify-between">
          <span>{t("designSystem.surface.codex")}</span>
          <AppIcon name="codex" label={t("designSystem.surface.codex")} />
        </Button>
      </div>

      {isDevelopment ? (
        <div className="rounded-radius-sm border border-border-default bg-bg-surface p-3 shadow-shadow-soft">
          <p className="text-xs uppercase tracking-[0.08em] text-fg-muted">{t("designSystem.sandbox.devOnly")}</p>
          <Button as="a" href="/ui/sandbox" intent="ghost" className="mt-2 w-full justify-between sm:w-auto">
            <span>{t("designSystem.sandbox.title")}</span>
            <AppIcon name="refresh" label={t("designSystem.sandbox.title")} />
          </Button>
        </div>
      ) : null}
    </main>
  );
}
