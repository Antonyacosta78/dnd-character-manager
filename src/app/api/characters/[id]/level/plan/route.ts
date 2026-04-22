import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { AuthSessionContext } from "@/server/adapters/auth/auth-session-context";
import { createPrismaCharacterRepository } from "@/server/adapters/prisma/character-repository";
import { createDerivedRulesCatalog } from "@/server/adapters/rules-catalog/derived-rules-catalog";
import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import { CharacterNotFoundError } from "@/server/application/errors/character-core-errors";
import { createPlanLevelUpUseCase } from "@/server/application/use-cases/plan-level-up";

function buildMeta(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? `req_${randomUUID()}`;

  return {
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const meta = buildMeta(request);
  const { id } = await context.params;

  try {
    const body = (await request.json()) as { classRef?: { name: string; source: string } };
    const planLevelUp = createPlanLevelUpUseCase({
      sessionContext: new AuthSessionContext(),
      characterRepository: createPrismaCharacterRepository(),
      rulesCatalog: createDerivedRulesCatalog(),
    });
    const result = await planLevelUp({
      characterId: id,
      classRef: body.classRef,
    });

    return NextResponse.json(
      {
        data: result,
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
