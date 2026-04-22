import type { CharacterAggregate, CharacterCatalogRef } from "@/server/ports/character-repository";
import type { CharacterLevelPlan } from "@/server/domain/character-core/character-core.types";

export function computeProficiencyBonus(level: number): number {
  if (level >= 17) {
    return 6;
  }

  if (level >= 13) {
    return 5;
  }

  if (level >= 9) {
    return 4;
  }

  if (level >= 5) {
    return 3;
  }

  return 2;
}

export interface BuildLevelPlanInput {
  character: CharacterAggregate;
  classRef?: CharacterCatalogRef;
}

export function buildLevelPlan(input: BuildLevelPlanInput): CharacterLevelPlan {
  const currentLevel = input.character.buildState.level;
  const targetLevel = currentLevel + 1;
  const classRef = input.classRef ?? input.character.buildState.classRef;
  const requiresMulticlassConfirmation =
    classRef.name !== input.character.buildState.classRef.name ||
    classRef.source !== input.character.buildState.classRef.source;

  return {
    targetLevel,
    classRef,
    autoApplied: [
      {
        code: "PROFICIENCY_BONUS",
        description: `Proficiency bonus is ${computeProficiencyBonus(targetLevel)} at level ${targetLevel}.`,
      },
    ],
    requiredChoices: [],
    requiresMulticlassConfirmation,
  };
}
