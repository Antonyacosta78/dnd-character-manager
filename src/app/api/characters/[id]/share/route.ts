import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { AuthSessionContext } from "@/server/adapters/auth/auth-session-context";
import { createPrismaCharacterRepository } from "@/server/adapters/prisma/character-repository";
import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import { CharacterNotFoundError } from "@/server/application/errors/character-core-errors";
import { createSetCharacterShareEnabledUseCase } from "@/server/application/use-cases/set-character-share-enabled";

function buildMeta(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? `req_${randomUUID()}`;

  return {
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const meta = buildMeta(request);
  const { id } = await context.params;

  try {
    const body = (await request.json()) as { enabled?: boolean };
    const setCharacterShareEnabled = createSetCharacterShareEnabledUseCase({
      sessionContext: new AuthSessionContext(),
      characterRepository: createPrismaCharacterRepository(),
    });
    const settings = await setCharacterShareEnabled({
      characterId: id,
      enabled: Boolean(body.enabled),
    });

    return NextResponse.json(
      {
        data: {
          share: settings,
        },
        meta,
      },
      {
        status: 200,
        headers: {
          "x-request-id": meta.requestId,
        },
      },
    );
  } catch (error) {
    const status = error instanceof AuthUnauthenticatedError ? 401 : error instanceof CharacterNotFoundError ? 404 : 500;
    const code = error instanceof AuthUnauthenticatedError
      ? "AUTH_UNAUTHENTICATED"
      : error instanceof CharacterNotFoundError
        ? "REQUEST_VALIDATION_FAILED"
        : "INTERNAL_ERROR";

    return NextResponse.json(
      {
        error: {
          code,
          message: error instanceof Error ? error.message : "An unexpected error occurred.",
          status,
        },
        meta,
      },
      {
        status,
        headers: {
          "x-request-id": meta.requestId,
        },
      },
    );
  }
}
