import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createPrismaCharacterRepository } from "@/server/adapters/prisma/character-repository";
import { AuthSessionContext } from "@/server/adapters/auth/auth-session-context";
import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import { createListOwnerCharactersUseCase } from "@/server/application/use-cases/list-owner-characters";

export default async function CharactersPage() {
  const t = await getTranslations("common");
  const listOwnerCharacters = createListOwnerCharactersUseCase({
    sessionContext: new AuthSessionContext(),
    characterRepository: createPrismaCharacterRepository(),
  });
  let characters: Awaited<ReturnType<typeof listOwnerCharacters>> = [];

  try {
    characters = await listOwnerCharacters();
  } catch (error) {
    if (error instanceof AuthUnauthenticatedError) {
      redirect("/sign-in");
    }

    throw error;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12 font-ui sm:px-10">
      <header className="space-y-2">
        <p className="text-sm text-fg-muted">{t("auth.characters.protectedLabel")}</p>
        <h1 className="font-display text-3xl tracking-tight text-fg-primary">{t("auth.characters.title")}</h1>
      </header>

      {characters.length === 0 ? (
        <div className="rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
          <p className="text-sm text-fg-secondary">{t("auth.characters.emptyState")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {characters.map((character) => (
            <li
              key={character.id}
              className="rounded-radius-sm border border-border-default bg-bg-surface px-4 py-3 shadow-shadow-soft"
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
    </main>
  );
}
