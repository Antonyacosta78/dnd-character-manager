import { stack } from "@nextwrappers/core";

import { createListOwnerCharactersUseCase } from "@/server/application/use-cases/list-owner-characters";
import {
  createResponseMeta,
  createRestErrorResponse,
  createRestSuccessResponse,
  mapRestError,
} from "@/server/entrypoint/api/rest-contract";
import { authentication } from "@/server/middleware/api/authentication";
import { DBService, type CharacterRepository } from "@/server/services/db";
import {
  SessionService,
  type SessionServiceClass,
} from "@/server/services/session";

type ListOwnerCharactersOperation = (request: Request) => Promise<Awaited<ReturnType<CharacterRepository["listByOwner"]>>>;

export interface CharactersApiEntrypointDeps {
  listOwnerCharacters: ListOwnerCharactersOperation;
  sessionService?: SessionServiceClass;
  now?: () => Date;
  createRequestId?: () => string;
}

export function createCharactersGetRoute({
  listOwnerCharacters,
  sessionService = SessionService,
  now,
  createRequestId,
}: CharactersApiEntrypointDeps) {
  return async function GET(request: Request) {
    const meta = createResponseMeta(request, { now, createRequestId });
    const handler = stack(
      authentication({
        sessionService,
      }),
    )(async (authenticatedRequest) => {
      const items = await listOwnerCharacters(authenticatedRequest);

      return createRestSuccessResponse({
        data: { items },
        meta,
      });
    });

    try {
      return await handler(request);
    } catch (error) {
      return createRestErrorResponse({
        error: mapRestError(error),
        meta,
      });
    }
  };
}

const defaultGetRoute = createCharactersGetRoute({
  listOwnerCharacters: async (request) => {
    const listOwnerCharacters = createListOwnerCharactersUseCase({
      sessionContext: {
        getSessionContext: () => SessionService.getSessionContextFromRequest(request),
      },
      characterRepository: DBService.characters,
    });

    return listOwnerCharacters();
  },
});

/** @implements GET /api/characters */
export async function GET(request: Request) {
  return defaultGetRoute(request);
}
