import { getTranslations } from "next-intl/server";

export default async function CharacterBranchesPage() {
  const t = await getTranslations("common");

  return (
    <section className="rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
      <p className="text-sm text-fg-secondary">{t("appShellNavigation.routeBody.characterBranches")}</p>
    </section>
  );
}
