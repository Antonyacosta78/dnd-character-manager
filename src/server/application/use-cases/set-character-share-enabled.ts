import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import { CharacterNotFoundError } from "@/server/application/errors/character-core-errors";
import type { CharacterRepository, CharacterShareSettings } from "@/server/ports/character-repository";
import type { SessionContextPort } from "@/server/ports/session-context";

export interface SetCharacterShareEnabledInput {
  characterId: string;
  enabled: boolean;
}

export interface SetCharacterShareEnabledUseCaseDeps {
  sessionContext: SessionContextPort;
  characterRepository: CharacterRepository;
}

export type SetCharacterShareEnabledUseCase = (
  input: SetCharacterShareEnabledInput,
) => Promise<CharacterShareSettings>;

export function createSetCharacterShareEnabledUseCase({
  sessionContext,
  characterRepository,
}: SetCharacterShareEnabledUseCaseDeps): SetCharacterShareEnabledUseCase {
  return async function setCharacterShareEnabled(input) {
    const session = await sessionContext.getSessionContext();

    if (!session.userId) {
      throw new AuthUnauthenticatedError();
    }

    const existing = await characterRepository.getByIdForOwner(input.characterId, session.userId);

    if (!existing) {
      throw new CharacterNotFoundError();
    }

    return characterRepository.setShareEnabled({
      characterId: input.characterId,
      ownerUserId: session.userId,
      enabled: input.enabled,
    });
  };
}
