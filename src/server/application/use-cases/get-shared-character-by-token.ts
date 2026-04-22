import { CharacterNotFoundError } from "@/server/application/errors/character-core-errors";
import type { CharacterAggregate, CharacterRepository } from "@/server/ports/character-repository";

export interface GetSharedCharacterByTokenInput {
  token: string;
}

export interface GetSharedCharacterByTokenUseCaseDeps {
  characterRepository: CharacterRepository;
}

export type GetSharedCharacterByTokenUseCase = (
  input: GetSharedCharacterByTokenInput,
) => Promise<CharacterAggregate>;

export function createGetSharedCharacterByTokenUseCase({
  characterRepository,
}: GetSharedCharacterByTokenUseCaseDeps): GetSharedCharacterByTokenUseCase {
  return async function getSharedCharacterByToken(input) {
    const character = await characterRepository.getByShareToken(input.token);

    if (!character) {
      throw new CharacterNotFoundError();
    }

    return character;
  };
}
