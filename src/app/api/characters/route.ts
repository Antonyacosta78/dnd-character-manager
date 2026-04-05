import { NextResponse } from "next/server";

import { createPrismaCharacterRepository } from "@/server/adapters/prisma/character-repository";
import { AuthSessionContext } from "@/server/adapters/auth/auth-session-context";
import {
  AuthForbiddenError,
  AuthUnauthenticatedError,
} from "@/server/application/errors/auth-errors";
import {
  createListOwnerCharactersUseCase,
  type ListOwnerCharactersUseCase,
} from "@/server/application/use-cases/list-owner-characters";
import { emitServerErrorLog } from "@/server/observability/server-error-log";
import { captureServerException } from "@/server/observability/sentry-server";
import {
  createRequestId,
  resolveRequestId,
} from "@/server/observability/request-id";

interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

interface ApiSuccess<T> {
  data: T;
  meta: ResponseMeta;
}

interface ApiErrorResponse {
  error: {
    code: "AUTH_UNAUTHENTICATED" | "AUTH_FORBIDDEN" | "INTERNAL_ERROR";
    message: string;
    status: number;
  };
  meta: ResponseMeta;
}

export interface CharactersRouteDeps {
  listOwnerCharacters: ListOwnerCharactersUseCase;
  now?: () => Date;
  createRequestId?: () => string;
  logError?: typeof emitServerErrorLog;
  captureException?: typeof captureServerException;
}

export function createCharactersGetRoute({
  listOwnerCharacters,
  now = () => new Date(),
  createRequestId: createRequestIdFallback = createRequestId,
  logError = emitServerErrorLog,
  captureException = captureServerException,
}: CharactersRouteDeps) {
  return async function GET(request: Request) {
    const requestId = resolveRequestId(request, createRequestIdFallback);
    const timestamp = now().toISOString();

    try {
      const items = await listOwnerCharacters();

      return NextResponse.json<ApiSuccess<{ items: Awaited<typeof items> }>>(
        {
          data: { items },
          meta: { requestId, timestamp },
        },
        {
          status: 200,
          headers: {
            "x-request-id": requestId,
          },
        },
      );
    } catch (error) {
      const mappedError = mapRouteError(error);

      logError({
        timestamp,
        message: "Characters route failed.",
        requestId,
        route: "/api/characters",
        method: request.method,
        error: {
          code: mappedError.code,
          status: mappedError.status,
          name: error instanceof Error ? error.name : undefined,
        },
      });

      captureException(error, {
        requestId,
        route: "/api/characters",
        method: request.method,
        errorCode: mappedError.code,
      });

      return NextResponse.json<ApiErrorResponse>(
        {
          error: mappedError,
          meta: { requestId, timestamp },
        },
        {
          status: mappedError.status,
          headers: {
            "x-request-id": requestId,
          },
        },
      );
    }
  };
}

const defaultGetRoute = createCharactersGetRoute({
  listOwnerCharacters: createListOwnerCharactersUseCase({
    sessionContext: new AuthSessionContext(),
    characterRepository: createPrismaCharacterRepository(),
  }),
});

export async function GET(request: Request) {
  return defaultGetRoute(request);
}

function mapRouteError(error: unknown): ApiErrorResponse["error"] {
  if (error instanceof AuthUnauthenticatedError) {
    return {
      code: "AUTH_UNAUTHENTICATED",
      message: "Authentication is required to access this resource.",
      status: 401,
    };
  }

  if (error instanceof AuthForbiddenError) {
    return {
      code: "AUTH_FORBIDDEN",
      message: "You are not allowed to access this resource.",
      status: 403,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    status: 500,
  };
}
