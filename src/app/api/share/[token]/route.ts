import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createPrismaCharacterRepository } from "@/server/adapters/prisma/character-repository";
import { CharacterNotFoundError } from "@/server/application/errors/character-core-errors";
import { createGetSharedCharacterByTokenUseCase } from "@/server/application/use-cases/get-shared-character-by-token";

function buildMeta(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? `req_${randomUUID()}`;

  return {
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const meta = buildMeta(request);
  const { token } = await context.params;

  try {
    const getSharedCharacterByToken = createGetSharedCharacterByTokenUseCase({
      characterRepository: createPrismaCharacterRepository(),
    });
    const character = await getSharedCharacterByToken({ token });

    return NextResponse.json(
      {
        data: {
          character,
          mode: "read-only",
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
    const status = error instanceof CharacterNotFoundError ? 404 : 500;

    return NextResponse.json(
      {
        error: {
          code: error instanceof CharacterNotFoundError ? "REQUEST_VALIDATION_FAILED" : "INTERNAL_ERROR",
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
