import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { AuthSessionContext } from "@/server/adapters/auth/auth-session-context";
import { createPrismaCharacterRepository } from "@/server/adapters/prisma/character-repository";
import { createDerivedRulesCatalog, RulesCatalogUnavailableError } from "@/server/adapters/rules-catalog/derived-rules-catalog";
import {
  AuthForbiddenError,
  AuthUnauthenticatedError,
} from "@/server/application/errors/auth-errors";
import { CharacterRequestValidationError } from "@/server/application/errors/character-core-errors";
import {
  createCreateCharacterUseCase,
  type CreateCharacterUseCase,
} from "@/server/application/use-cases/create-character";
import {
  createListOwnerCharactersUseCase,
  type ListOwnerCharactersUseCase,
} from "@/server/application/use-cases/list-owner-characters";
import type { CharacterDraftPayload, CharacterInventoryEntry, CharacterSpellEntry } from "@/server/ports/character-repository";

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
    code:
      | "AUTH_UNAUTHENTICATED"
      | "AUTH_FORBIDDEN"
      | "REQUEST_VALIDATION_FAILED"
      | "RULES_CATALOG_UNAVAILABLE"
      | "INTERNAL_ERROR";
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
  meta: ResponseMeta;
}

interface CreateCharacterRequestBody {
  draft: CharacterDraftPayload;
  acknowledgedWarningCodes?: string[];
}

export interface CharactersRouteDeps {
  listOwnerCharacters: ListOwnerCharactersUseCase;
  createCharacter: CreateCharacterUseCase;
  now?: () => Date;
  createRequestId?: () => string;
}

export function createCharactersRoute({
  listOwnerCharacters,
  createCharacter,
  now = () => new Date(),
  createRequestId = () => `req_${randomUUID()}`,
}: CharactersRouteDeps) {
  return {
    async GET(request: Request) {
      const requestId = resolveRequestId(request, createRequestId);
      const timestamp = now().toISOString();

      try {
        const items = await listOwnerCharacters();

        return createSuccessResponse(
          requestId,
          200,
          {
            data: {
              items,
            },
            meta: {
              requestId,
              timestamp,
            },
          },
        );
      } catch (error) {
        return createErrorResponse(requestId, timestamp, mapRouteError(error));
      }
    },

    async POST(request: Request) {
      const requestId = resolveRequestId(request, createRequestId);
      const timestamp = now().toISOString();

      const parsedBody = await parseCreateCharacterRequestBody(request);

      if (!parsedBody.ok) {
        return createErrorResponse(requestId, timestamp, {
          code: "REQUEST_VALIDATION_FAILED",
          message: "Request validation failed.",
          status: 400,
          details: {
            fields: parsedBody.fields,
          },
        });
      }

      try {
        const created = await createCharacter({
          draft: parsedBody.value.draft,
          acknowledgedWarningCodes: parsedBody.value.acknowledgedWarningCodes,
        });

        return createSuccessResponse(
          requestId,
          201,
          {
            data: {
              character: created,
            },
            meta: {
              requestId,
              timestamp,
            },
          },
        );
      } catch (error) {
        return createErrorResponse(requestId, timestamp, mapRouteError(error));
      }
    },
  };
}

export const { GET, POST } = createCharactersRoute({
  listOwnerCharacters: createListOwnerCharactersUseCase({
    sessionContext: new AuthSessionContext(),
    characterRepository: createPrismaCharacterRepository(),
  }),
  createCharacter: createCreateCharacterUseCase({
    sessionContext: new AuthSessionContext(),
    characterRepository: createPrismaCharacterRepository(),
    rulesCatalog: createDerivedRulesCatalog(),
  }),
});

type ParsedCreateCharacterBody =
  | {
      ok: true;
      value: {
        draft: CharacterDraftPayload;
        acknowledgedWarningCodes: string[];
      };
    }
  | {
      ok: false;
      fields: Record<string, string[]>;
    };

async function parseCreateCharacterRequestBody(request: Request): Promise<ParsedCreateCharacterBody> {
  let body: CreateCharacterRequestBody;

  try {
    body = (await request.json()) as CreateCharacterRequestBody;
  } catch {
    return {
      ok: false,
      fields: {
        body: ["invalidPayload"],
      },
    };
  }

  if (!body || typeof body !== "object") {
    return {
      ok: false,
      fields: {
        body: ["invalidPayload"],
      },
    };
  }

  const draft = body.draft;
  const acknowledgedWarningCodes = body.acknowledgedWarningCodes ?? [];

  if (!draft || typeof draft !== "object") {
    return {
      ok: false,
      fields: {
        draft: ["required"],
      },
    };
  }

  if (!Array.isArray(acknowledgedWarningCodes) || !acknowledgedWarningCodes.every((code) => typeof code === "string")) {
    return {
      ok: false,
      fields: {
        acknowledgedWarningCodes: ["invalidType"],
      },
    };
  }

  const draftRecord = draft as unknown as Record<string, unknown>;
  const classRefCandidate = draftRecord.classRef;

  if (!classRefCandidate || typeof classRefCandidate !== "object") {
    return {
      ok: false,
      fields: {
        classRef: ["required"],
      },
    };
  }

  const optionalRuleRefs = Array.isArray(draftRecord.optionalRuleRefs)
    ? draftRecord.optionalRuleRefs
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        name: String(item.name ?? ""),
        source: String(item.source ?? ""),
      }))
    : [];

  const inventory: CharacterInventoryEntry[] = Array.isArray(draftRecord.inventory)
    ? draftRecord.inventory
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item, index) => ({
        id: String(item.id ?? `inv-${index}`),
        label: String(item.label ?? ""),
        quantity: Number(item.quantity ?? 1),
        carriedState: item.carriedState === "stored" ? "stored" : "carried",
        weight: item.weight === undefined ? undefined : Number(item.weight),
        notes: item.notes === undefined ? undefined : String(item.notes),
        catalogRef:
          item.catalogRef && typeof item.catalogRef === "object"
            ? {
              name: String((item.catalogRef as Record<string, unknown>).name ?? ""),
              source: String((item.catalogRef as Record<string, unknown>).source ?? ""),
            }
            : undefined,
      }))
    : [];

  const spells: CharacterSpellEntry[] = Array.isArray(draftRecord.spells)
    ? draftRecord.spells
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item, index) => ({
        id: String(item.id ?? `spell-${index}`),
        label: String(item.label ?? ""),
        level: item.level === undefined ? undefined : Number(item.level),
        status:
          item.status === "prepared"
            ? "prepared"
            : item.status === "always"
              ? "always"
              : "known",
        notes: item.notes === undefined ? undefined : String(item.notes),
        catalogRef:
          item.catalogRef && typeof item.catalogRef === "object"
            ? {
              name: String((item.catalogRef as Record<string, unknown>).name ?? ""),
              source: String((item.catalogRef as Record<string, unknown>).source ?? ""),
            }
            : undefined,
      }))
    : [];

  return {
    ok: true,
    value: {
      draft: {
        name: String(draftRecord.name ?? ""),
        concept: String(draftRecord.concept ?? ""),
        classRef: {
          name: String((classRefCandidate as Record<string, unknown>).name ?? ""),
          source: String((classRefCandidate as Record<string, unknown>).source ?? ""),
        },
        level: Number(draftRecord.level ?? 1),
        notes: draftRecord.notes === undefined ? undefined : String(draftRecord.notes),
        inventory,
        spells,
        optionalRuleRefs,
      },
      acknowledgedWarningCodes,
    },
  };
}

function resolveRequestId(request: Request, fallback: () => string): string {
  const requestId = request.headers.get("x-request-id");

  if (!requestId) {
    return fallback();
  }

  const isSafeRequestId = /^[A-Za-z0-9._:-]{1,120}$/.test(requestId);

  return isSafeRequestId ? requestId : fallback();
}

function createSuccessResponse<T>(requestId: string, status: number, payload: ApiSuccess<T>) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "x-request-id": requestId,
    },
  });
}

function createErrorResponse(
  requestId: string,
  timestamp: string,
  error: ApiErrorResponse["error"],
) {
  return NextResponse.json<ApiErrorResponse>(
    {
      error,
      meta: {
        requestId,
        timestamp,
      },
    },
    {
      status: error.status,
      headers: {
        "x-request-id": requestId,
      },
    },
  );
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

  if (error instanceof CharacterRequestValidationError) {
    return {
      code: "REQUEST_VALIDATION_FAILED",
      message: error.message,
      status: 400,
      details: error.details,
    };
  }

  if (error instanceof RulesCatalogUnavailableError) {
    return {
      code: "RULES_CATALOG_UNAVAILABLE",
      message: "Rules catalog is unavailable.",
      status: 503,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    status: 500,
  };
}
