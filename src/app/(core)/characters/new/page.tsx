import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { CharacterBuilderStepOne } from "@/components/character-core/character-builder-step-one";

export default async function NewCharacterPage() {
  const t = await getTranslations("common");

  return (
    <div className="space-y-4">
      <CharacterBuilderStepOne
        copy={{
          title: t("characterCore.builder.stepOne.title"),
          description: t("characterCore.builder.stepOne.description"),
          nameLabel: t("characterCore.builder.stepOne.nameLabel"),
          namePlaceholder: t("characterCore.builder.stepOne.namePlaceholder"),
          conceptLabel: t("characterCore.builder.stepOne.conceptLabel"),
          conceptPlaceholder: t("characterCore.builder.stepOne.conceptPlaceholder"),
          classLabel: t("characterCore.builder.stepOne.classLabel"),
          classPlaceholder: t("characterCore.builder.stepOne.classPlaceholder"),
          classSourceLabel: t("characterCore.builder.stepOne.classSourceLabel"),
          levelLabel: t("characterCore.builder.stepOne.levelLabel"),
          levelValue: t("characterCore.builder.stepOne.levelValue"),
          acknowledgeWarning: t("characterCore.builder.stepOne.acknowledgeWarning"),
          save: t("characterCore.builder.stepOne.save"),
          saving: t("characterCore.builder.stepOne.saving"),
          genericError: t("characterCore.builder.stepOne.errors.generic"),
          validationError: t("characterCore.builder.stepOne.errors.validation"),
          warningConceptShort: t("characterCore.builder.stepOne.warnings.conceptShort"),
          loadClassesError: t("characterCore.builder.stepOne.errors.loadClasses"),
          unsavedDraft: t("characterCore.builder.stepOne.unsavedDraft"),
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
