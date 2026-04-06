import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { AuthSessionContext } from "@/server/adapters/auth/auth-session-context";
import { createPrismaCharacterRepository } from "@/server/adapters/prisma/character-repository";
import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import { CharacterNotFoundError } from "@/server/application/errors/character-core-errors";
import { createExportCharacterPdfUseCase, type CharacterPdfExportMode } from "@/server/application/use-cases/export-character-pdf";

function buildMeta(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? `req_${randomUUID()}`;

  return {
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const meta = buildMeta(request);
  const { id } = await context.params;

  try {
    const url = new URL(request.url);
    const mode = (url.searchParams.get("mode") ?? "summary") as CharacterPdfExportMode;

    if (mode !== "official" && mode !== "summary") {
      return NextResponse.json(
        {
          error: {
            code: "REQUEST_VALIDATION_FAILED",
            message: "Invalid export mode.",
            status: 400,
            details: {
              fields: {
                mode: ["invalidType"],
              },
            },
          },
          meta,
        },
        {
          status: 400,
          headers: {
            "x-request-id": meta.requestId,
          },
        },
      );
    }

    const exportCharacterPdf = createExportCharacterPdfUseCase({
      sessionContext: new AuthSessionContext(),
      characterRepository: createPrismaCharacterRepository(),
    });
    const exported = await exportCharacterPdf({
      characterId: id,
      mode,
    });

    return new NextResponse(Buffer.from(exported.bytes), {
      status: 200,
      headers: {
        "content-type": exported.contentType,
        "content-disposition": `attachment; filename="${exported.filename}"`,
        "x-request-id": meta.requestId,
      },
    });
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
