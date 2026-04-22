import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import { CharacterNotFoundError, CharacterSaveConflictError } from "@/server/application/errors/character-core-errors";
import type {
  CharacterInventoryEntry,
  CharacterRepository,
} from "@/server/ports/character-repository";
import type { SessionContextPort } from "@/server/ports/session-context";

export interface UpdateCharacterInventoryInput {
  characterId: string;
  baseRevision: number;
  inventory: CharacterInventoryEntry[];
}

export interface UpdateCharacterInventoryUseCaseDeps {
  sessionContext: SessionContextPort;
  characterRepository: CharacterRepository;
}

export type UpdateCharacterInventoryUseCase = (input: UpdateCharacterInventoryInput) => Promise<{ revision: number }>;

export function createUpdateCharacterInventoryUseCase({
  sessionContext,
  characterRepository,
}: UpdateCharacterInventoryUseCaseDeps): UpdateCharacterInventoryUseCase {
  return async function updateCharacterInventory(input) {
    const session = await sessionContext.getSessionContext();

    if (!session.userId) {
      throw new AuthUnauthenticatedError();
    }

    const character = await characterRepository.getByIdForOwner(input.characterId, session.userId);

    if (!character) {
      throw new CharacterNotFoundError();
    }

    const saved = await characterRepository.saveCanonical({
      characterId: input.characterId,
      ownerUserId: session.userId,
      baseRevision: input.baseRevision,
      acknowledgedWarningCodes: character.warningOverrides.map((warning) => warning.code),
      draft: {
        name: character.name,
        concept: character.buildState.concept,
        classRef: character.buildState.classRef,
        level: character.buildState.level,
        notes: character.buildState.notes,
        spells: character.spells,
        optionalRuleRefs: character.buildState.optionalRuleRefs,
        inventory: input.inventory,
      },
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
          inventory: input.inventory,
          spells: character.spells,
          optionalRuleRefs: character.buildState.optionalRuleRefs,
        },
      });
    }

    return {
      revision: saved.character.revision,
    };
  };
}
