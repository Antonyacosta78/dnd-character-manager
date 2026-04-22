import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import { CharacterNotFoundError } from "@/server/application/errors/character-core-errors";
import type { CharacterAggregate, CharacterRepository } from "@/server/ports/character-repository";
import type { SessionContextPort } from "@/server/ports/session-context";

export interface GetOwnerCharacterByIdInput {
  characterId: string;
}

export interface GetOwnerCharacterByIdUseCaseDeps {
  sessionContext: SessionContextPort;
  characterRepository: CharacterRepository;
}

export type GetOwnerCharacterByIdUseCase = (
  input: GetOwnerCharacterByIdInput,
) => Promise<CharacterAggregate>;

export function createGetOwnerCharacterByIdUseCase({
  sessionContext,
  characterRepository,
}: GetOwnerCharacterByIdUseCaseDeps): GetOwnerCharacterByIdUseCase {
  return async function getOwnerCharacterById(input) {
    const session = await sessionContext.getSessionContext();

    if (!session.userId) {
      throw new AuthUnauthenticatedError();
    }

    const character = await characterRepository.getByIdForOwner(input.characterId, session.userId);

    if (!character) {
      throw new CharacterNotFoundError();
    }

    return character;
  };
}
