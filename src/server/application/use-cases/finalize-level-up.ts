import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import {
  CharacterNotFoundError,
  CharacterRequestValidationError,
  CharacterSaveConflictError,
} from "@/server/application/errors/character-core-errors";
import { buildLevelPlan } from "@/server/domain/character-core/leveling";
import type { CharacterCatalogRef, CharacterRepository } from "@/server/ports/character-repository";
import type { RulesCatalog } from "@/server/ports/rules-catalog";
import type { SessionContextPort } from "@/server/ports/session-context";

export interface FinalizeLevelUpInput {
  characterId: string;
  baseRevision: number;
  classRef: CharacterCatalogRef;
  confirmClassChange?: boolean;
  notes?: string;
}

export interface FinalizeLevelUpUseCaseDeps {
  sessionContext: SessionContextPort;
  characterRepository: CharacterRepository;
  rulesCatalog: RulesCatalog;
}

export interface FinalizeLevelUpResult {
  characterId: string;
  revision: number;
  level: number;
}

export type FinalizeLevelUpUseCase = (input: FinalizeLevelUpInput) => Promise<FinalizeLevelUpResult>;

export function createFinalizeLevelUpUseCase({
  sessionContext,
  characterRepository,
  rulesCatalog,
}: FinalizeLevelUpUseCaseDeps): FinalizeLevelUpUseCase {
  return async function finalizeLevelUp(input) {
    const session = await sessionContext.getSessionContext();

    if (!session.userId) {
      throw new AuthUnauthenticatedError();
    }

    const character = await characterRepository.getByIdForOwner(input.characterId, session.userId);

    if (!character) {
      throw new CharacterNotFoundError();
    }

    const classFromCatalog = await rulesCatalog.classes.get(input.classRef);

    if (!classFromCatalog) {
      throw new CharacterRequestValidationError({
        hardIssues: [
          {
            code: "CHARACTER_CORE_CLASS_NOT_IN_CATALOG",
            path: "classRef",
            message: "Selected class was not found in the active rules catalog.",
          },
        ],
      });
    }

    const plan = buildLevelPlan({
      character,
      classRef: input.classRef,
    });

    if (plan.requiresMulticlassConfirmation && !input.confirmClassChange) {
      throw new CharacterRequestValidationError({
        hardIssues: [
          {
            code: "CHARACTER_CORE_MULTICLASS_CONFIRMATION_REQUIRED",
            path: "confirmClassChange",
            message: "Multiclass level-up requires explicit confirmation.",
          },
        ],
      });
    }

    const saved = await characterRepository.finalizeLevelUp({
      characterId: input.characterId,
      ownerUserId: session.userId,
      baseRevision: input.baseRevision,
      classRef: input.classRef,
      levelNumber: plan.targetLevel,
      notes: input.notes,
    });

    if (saved.kind === "conflict") {
      throw new CharacterSaveConflictError({
        characterId: saved.characterId,
        baseRevision: saved.baseRevision,
        serverRevision: saved.serverRevision,
        changedSections: saved.changedSections,
        draft: {
          name: character.name,
          concept: character.buildState.concept,
          classRef: character.buildState.classRef,
          level: character.buildState.level,
          notes: character.buildState.notes,
          inventory: character.inventory,
          spells: character.spells,
          optionalRuleRefs: character.buildState.optionalRuleRefs,
        },
      });
    }

    return {
      characterId: saved.character.id,
      revision: saved.character.revision,
      level: saved.character.buildState.level,
    };
  };
}
