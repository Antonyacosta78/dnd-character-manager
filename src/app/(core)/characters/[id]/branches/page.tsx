import { getTranslations } from "next-intl/server";

export default async function CharacterEntityBranchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, t] = await Promise.all([params, getTranslations("common")]);

  return (
    <section className="rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
      <p className="text-sm text-fg-secondary">{t("appShellNavigation.routeBody.characterEntityBranches", { id })}</p>
    </section>
  );
}
