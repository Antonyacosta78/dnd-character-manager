import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { AuthSessionContext } from "@/server/adapters/auth/auth-session-context";
import { createPrismaCharacterRepository } from "@/server/adapters/prisma/character-repository";
import { createListOwnerCharactersUseCase } from "@/server/application/use-cases/list-owner-characters";

export default async function CharactersPage() {
  const t = await getTranslations("common");
  const listOwnerCharacters = createListOwnerCharactersUseCase({
    sessionContext: new AuthSessionContext(),
    characterRepository: createPrismaCharacterRepository(),
  });
  let characters: Awaited<ReturnType<typeof listOwnerCharacters>> = [];
  characters = await listOwnerCharacters();

  return (
    <div className="space-y-4 rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-fg-primary">{t("auth.characters.title")}</h1>
        <Link href="/characters/new" className="text-sm text-accent-rubric underline-offset-2 hover:underline">
          {t("characterCore.list.createCta")}
        </Link>
      </div>

      {characters.length === 0 ? (
        <p className="text-sm text-fg-secondary">{t("auth.characters.emptyState")}</p>
      ) : (
        <ul className="space-y-3">
          {characters.map((character) => (
            <li
              key={character.id}
              className="rounded-radius-sm border border-border-default bg-bg-elevated px-4 py-3 shadow-shadow-soft"
            >
              <Link href={`/characters/${character.id}`} className="font-semibold text-fg-primary underline-offset-2 hover:underline">
                {character.name}
              </Link>
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
