import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthSessionContext } from "@/server/adapters/auth/auth-session-context";
import { createPrismaCharacterRepository } from "@/server/adapters/prisma/character-repository";
import { CharacterNotFoundError } from "@/server/application/errors/character-core-errors";
import { createGetOwnerCharacterByIdUseCase } from "@/server/application/use-cases/get-owner-character-by-id";
import { CharacterSheetLayout } from "@/components/character-core/character-sheet-layout";

export default async function CharacterSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, t] = await Promise.all([params, getTranslations("common")]);
  const getOwnerCharacterById = createGetOwnerCharacterByIdUseCase({
    sessionContext: new AuthSessionContext(),
    characterRepository: createPrismaCharacterRepository(),
  });

  const character = await getOwnerCharacterById({ characterId: id }).catch((error) => {
    if (error instanceof CharacterNotFoundError) {
      notFound();
    }

    throw error;
  });

  return (
    <div className="space-y-4">
      <CharacterSheetLayout
        character={character}
        copy={{
          tabsAria: t("characterCore.sheet.tabsAria"),
          tabs: {
            core: t("characterCore.sheet.tabs.core"),
            progression: t("characterCore.sheet.tabs.progression"),
            inventory: t("characterCore.sheet.tabs.inventory"),
            spells: t("characterCore.sheet.tabs.spells"),
            notes: t("characterCore.sheet.tabs.notes"),
          },
          save: t("characterCore.sheet.save"),
          saving: t("characterCore.sheet.saving"),
          dirty: t("characterCore.sheet.dirty"),
          saved: t("characterCore.sheet.saved"),
          nameLabel: t("characterCore.sheet.nameLabel"),
          conceptLabel: t("characterCore.sheet.conceptLabel"),
          notesLabel: t("characterCore.sheet.notesLabel"),
          validation: {
            title: t("characterCore.sheet.validation.title"),
            hardTitle: t("characterCore.sheet.validation.hardTitle"),
            warningTitle: t("characterCore.sheet.validation.warningTitle"),
            acknowledgeLabel: t("characterCore.sheet.validation.acknowledgeLabel"),
          },
          inventory: {
            title: t("characterCore.sheet.inventory.title"),
            addRow: t("characterCore.sheet.inventory.addRow"),
            labelPlaceholder: t("characterCore.sheet.inventory.labelPlaceholder"),
            quantityLabel: t("characterCore.sheet.inventory.quantityLabel"),
            remove: t("characterCore.sheet.inventory.remove"),
          },
          spells: {
            title: t("characterCore.sheet.spells.title"),
            addRow: t("characterCore.sheet.spells.addRow"),
            labelPlaceholder: t("characterCore.sheet.spells.labelPlaceholder"),
            statusLabel: t("characterCore.sheet.spells.statusLabel"),
            remove: t("characterCore.sheet.spells.remove"),
            statuses: {
              known: t("characterCore.sheet.spells.statuses.known"),
              prepared: t("characterCore.sheet.spells.statuses.prepared"),
              always: t("characterCore.sheet.spells.statuses.always"),
            },
          },
          level: {
            title: t("characterCore.sheet.level.title"),
            plan: t("characterCore.sheet.level.plan"),
            finalize: t("characterCore.sheet.level.finalize"),
            planning: t("characterCore.sheet.level.planning"),
            finalizing: t("characterCore.sheet.level.finalizing"),
            multiclassConfirm: t("characterCore.sheet.level.multiclassConfirm"),
            targetLevelLabel: t("characterCore.sheet.level.targetLevelLabel"),
          },
          share: {
            title: t("characterCore.sheet.share.title"),
            description: t("characterCore.sheet.share.description"),
            enable: t("characterCore.sheet.share.enable"),
            disable: t("characterCore.sheet.share.disable"),
            enabled: t("characterCore.sheet.share.enabled"),
            disabled: t("characterCore.sheet.share.disabled"),
          },
          export: {
            title: t("characterCore.sheet.export.title"),
            summary: t("characterCore.sheet.export.summary"),
            official: t("characterCore.sheet.export.official"),
            saveThenExport: t("characterCore.sheet.export.saveThenExport"),
            exportLastSaved: t("characterCore.sheet.export.exportLastSaved"),
          },
          conflict: {
            title: t("characterCore.sheet.conflict.title"),
            description: t("characterCore.sheet.conflict.description"),
            keepLocal: t("characterCore.sheet.conflict.keepLocal"),
            keepServer: t("characterCore.sheet.conflict.keepServer"),
            reviewDifferences: t("characterCore.sheet.conflict.reviewDifferences"),
            changedSectionsLabel: t("characterCore.sheet.conflict.changedSectionsLabel"),
          },
        }}
      />

      <div>
        <Link href="/characters" className="text-sm text-accent-rubric underline-offset-2 hover:underline">
          {t("characterCore.backToCharacters")}
        </Link>
      </div>
    </div>
  );
}
