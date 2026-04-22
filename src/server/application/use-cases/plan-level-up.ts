import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import { CharacterNotFoundError } from "@/server/application/errors/character-core-errors";
import { buildLevelPlan } from "@/server/domain/character-core/leveling";
import type { CharacterCatalogRef, CharacterRepository } from "@/server/ports/character-repository";
import type { RulesCatalog } from "@/server/ports/rules-catalog";
import type { SessionContextPort } from "@/server/ports/session-context";

export interface PlanLevelUpInput {
  characterId: string;
  classRef?: CharacterCatalogRef;
}

export interface PlanLevelUpResult {
  plan: ReturnType<typeof buildLevelPlan>;
  datasetFingerprint: string;
}

export interface PlanLevelUpUseCaseDeps {
  sessionContext: SessionContextPort;
  characterRepository: CharacterRepository;
  rulesCatalog: RulesCatalog;
}

export type PlanLevelUpUseCase = (input: PlanLevelUpInput) => Promise<PlanLevelUpResult>;

export function createPlanLevelUpUseCase({
  sessionContext,
  characterRepository,
  rulesCatalog,
}: PlanLevelUpUseCaseDeps): PlanLevelUpUseCase {
  return async function planLevelUp(input) {
    const session = await sessionContext.getSessionContext();

    if (!session.userId) {
      throw new AuthUnauthenticatedError();
    }

    const character = await characterRepository.getByIdForOwner(input.characterId, session.userId);

    if (!character) {
      throw new CharacterNotFoundError();
    }

    if (input.classRef) {
      const classFromCatalog = await rulesCatalog.classes.get(input.classRef);

      if (!classFromCatalog) {
        throw new CharacterNotFoundError("Requested class was not found in the active rules catalog.");
      }
    }

    const dataset = await rulesCatalog.getDatasetVersion();

    return {
      plan: buildLevelPlan({
        character,
        classRef: input.classRef,
      }),
      datasetFingerprint: dataset.fingerprint,
    };
  };
}
