import {
  AuthForbiddenError,
  AuthUnauthenticatedError,
} from "@/server/application/errors/auth-errors";
import type {
  CharacterRepository,
  CharacterSummary,
} from "@/server/ports/character-repository";
import type { SessionContextPort } from "@/server/ports/session-context";

export interface ListOwnerCharactersInput {
  ownerUserId?: string;
}

export interface ListOwnerCharactersUseCaseDeps {
  sessionContext: SessionContextPort;
  characterRepository: CharacterRepository;
}

export type ListOwnerCharactersUseCase = (
  input?: ListOwnerCharactersInput,
) => Promise<CharacterSummary[]>;

export function createListOwnerCharactersUseCase({
  sessionContext,
  characterRepository,
}: ListOwnerCharactersUseCaseDeps): ListOwnerCharactersUseCase {
  return async function listOwnerCharacters(input = {}) {
    const session = await sessionContext.getSessionContext();

    if (!session.userId) {
      throw new AuthUnauthenticatedError();
    }

    const ownerUserId = input.ownerUserId ?? session.userId;

    if (!session.isAdmin && ownerUserId !== session.userId) {
      throw new AuthForbiddenError();
    }

    return characterRepository.listByOwner(ownerUserId);
  };
}
