import { createPrismaCharacterRepository } from "@/server/adapters/prisma/character-repository";
import { AuthSessionContext } from "@/server/adapters/auth/auth-session-context";
import {
  createListOwnerCharactersUseCase,
  type ListOwnerCharactersUseCase,
} from "@/server/application/use-cases/list-owner-characters";

import {
  createResponseMeta,
  createRestErrorResponse,
  createRestSuccessResponse,
  mapRestError,
} from "@/server/entrypoint/api/rest-contract";

export interface CharactersApiEntrypointDeps {
  listOwnerCharacters: ListOwnerCharactersUseCase;
  now?: () => Date;
  createRequestId?: () => string;
}

export function createCharactersGetRoute({
  listOwnerCharacters,
  now,
  createRequestId,
}: CharactersApiEntrypointDeps) {
  return async function GET(request: Request) {
    const meta = createResponseMeta(request, { now, createRequestId });

    try {
      const items = await listOwnerCharacters();

      return createRestSuccessResponse({
        data: { items },
        meta,
      });
    } catch (error) {
      return createRestErrorResponse({
        error: mapRestError(error),
        meta,
      });
    }
  };
}

const defaultGetRoute = createCharactersGetRoute({
  listOwnerCharacters: createListOwnerCharactersUseCase({
    sessionContext: new AuthSessionContext(),
    characterRepository: createPrismaCharacterRepository(),
  }),
});

/** @implements GET /api/characters */
export async function GET(request: Request) {
  return defaultGetRoute(request);
}
