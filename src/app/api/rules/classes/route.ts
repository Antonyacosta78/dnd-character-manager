import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { AuthSessionContext } from "@/server/adapters/auth/auth-session-context";
import { createDerivedRulesCatalog, RulesCatalogUnavailableError } from "@/server/adapters/rules-catalog/derived-rules-catalog";
import type { RulesCatalog } from "@/server/ports/rules-catalog";
import type { SessionContextPort } from "@/server/ports/session-context";

interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

interface ApiErrorResponse {
  error: {
    code:
      | "AUTH_UNAUTHENTICATED"
      | "REQUEST_VALIDATION_FAILED"
      | "RULES_CATALOG_UNAVAILABLE"
      | "INTERNAL_ERROR";
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
  meta: ResponseMeta;
}

interface RulesClassesRouteDeps {
  sessionContext: SessionContextPort;
  rulesCatalog: RulesCatalog;
  now?: () => Date;
  createRequestId?: () => string;
}

export function createRulesClassesGetRoute({
  sessionContext,
  rulesCatalog,
  now = () => new Date(),
  createRequestId = () => `req_${randomUUID()}`,
}: RulesClassesRouteDeps) {
  return async function GET(request: Request) {
    const requestId = resolveRequestId(request, createRequestId);
    const timestamp = now().toISOString();

    try {
      const session = await sessionContext.getSessionContext();

      if (!session.userId) {
        return createErrorResponse(requestId, timestamp, {
          code: "AUTH_UNAUTHENTICATED",
          message: "Authentication is required to access this resource.",
          status: 401,
        });
      }

      const url = new URL(request.url);
      const q = url.searchParams.get("q")?.trim();

      if (q && (q.length < 1 || q.length > 80)) {
        return createErrorResponse(requestId, timestamp, {
          code: "REQUEST_VALIDATION_FAILED",
          message: "Query parameter q must be between 1 and 80 characters.",
          status: 400,
          details: {
            fields: {
              q: ["invalidLength"],
            },
          },
        });
      }

      const [items, dataset] = await Promise.all([
        rulesCatalog.classes.list({ search: q }),
        rulesCatalog.getDatasetVersion(),
      ]);

      return NextResponse.json(
        {
          data: {
            items: items.map((item) => ({
              name: item.ref.name,
              source: item.ref.source,
            })),
            count: items.length,
            dataset: {
              provider: dataset.provider,
              fingerprint: dataset.fingerprint,
            },
          },
          meta: {
            requestId,
            timestamp,
          },
        },
        {
          status: 200,
          headers: {
            "x-request-id": requestId,
          },
        },
      );
    } catch (error) {
      if (error instanceof RulesCatalogUnavailableError) {
        return createErrorResponse(requestId, timestamp, {
          code: "RULES_CATALOG_UNAVAILABLE",
          message: "Rules catalog is unavailable.",
          status: 503,
        });
      }

      return createErrorResponse(requestId, timestamp, {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        status: 500,
      });
    }
  };
}

export const GET = createRulesClassesGetRoute({
  sessionContext: new AuthSessionContext(),
  rulesCatalog: createDerivedRulesCatalog(),
});

function resolveRequestId(request: Request, fallback: () => string): string {
  const requestId = request.headers.get("x-request-id");

  if (!requestId) {
    return fallback();
  }

  const isSafeRequestId = /^[A-Za-z0-9._:-]{1,120}$/.test(requestId);

  return isSafeRequestId ? requestId : fallback();
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
