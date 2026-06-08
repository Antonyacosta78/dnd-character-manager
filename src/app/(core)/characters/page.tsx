import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function CharactersPage() {
  const t = await getTranslations("common");
  const characters: Array<{
    id: string;
    name: string;
    updatedAt: Date;
  }> = [];

  return (
    <div className="space-y-4 rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
      {characters.length === 0 ? (
        <p className="text-sm text-fg-secondary">{t("auth.characters.emptyState")}</p>
      ) : (
        <ul className="space-y-3">
          {characters.map((character) => (
            <li
              key={character.id}
              className="rounded-radius-sm border border-border-default bg-bg-elevated px-4 py-3 shadow-shadow-soft"
            >
              <p className="font-semibold text-fg-primary">{character.name}</p>
              <p className="mt-1 text-xs text-fg-muted">
                {t("auth.characters.lastUpdated", {
                  updatedAt: character.updatedAt.toISOString(),
                })}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Link href="/" className="text-sm text-accent-rubric underline-offset-2 hover:underline">
          {t("auth.characters.backHome")}
        </Link>
      </div>
    </div>
  );
}
