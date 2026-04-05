import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import { CharacterNotFoundError, CharacterSaveConflictError } from "@/server/application/errors/character-core-errors";
import type {
  CharacterRepository,
  CharacterSpellEntry,
} from "@/server/ports/character-repository";
import type { SessionContextPort } from "@/server/ports/session-context";

export interface UpdateCharacterSpellsInput {
  characterId: string;
  baseRevision: number;
  spells: CharacterSpellEntry[];
}

export interface UpdateCharacterSpellsUseCaseDeps {
  sessionContext: SessionContextPort;
  characterRepository: CharacterRepository;
}

export type UpdateCharacterSpellsUseCase = (input: UpdateCharacterSpellsInput) => Promise<{ revision: number }>;

export function createUpdateCharacterSpellsUseCase({
  sessionContext,
  characterRepository,
}: UpdateCharacterSpellsUseCaseDeps): UpdateCharacterSpellsUseCase {
  return async function updateCharacterSpells(input) {
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
        inventory: character.inventory,
        optionalRuleRefs: character.buildState.optionalRuleRefs,
        spells: input.spells,
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
          inventory: character.inventory,
          spells: input.spells,
          optionalRuleRefs: character.buildState.optionalRuleRefs,
        },
      });
    }

    return {
      revision: saved.character.revision,
    };
  };
}
