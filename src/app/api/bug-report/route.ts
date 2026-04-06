import { NextResponse } from "next/server";

import { readObservabilityConfig } from "@/server/composition/app-config";
import {
  type BugReportValidationFields,
  validateBugReportPayload,
} from "@/server/observability/bug-report-schema";
import "@/server/observability/sentry-server-adapter";
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
    code: "REQUEST_VALIDATION_FAILED" | "INTERNAL_ERROR";
    message: string;
    status: number;
    details?: {
      fields?: BugReportValidationFields;
    };
  };
  meta: ResponseMeta;
}

export interface BugReportRouteDeps {
  now?: () => Date;
  createRequestId?: () => string;
  logError?: typeof emitServerErrorLog;
  captureException?: typeof captureServerException;
}

export function createBugReportPostRoute({
  now = () => new Date(),
  createRequestId: createRequestIdFallback = createRequestId,
  logError = emitServerErrorLog,
  captureException = captureServerException,
}: BugReportRouteDeps = {}) {
  return async function POST(request: Request) {
    const requestId = resolveRequestId(request, createRequestIdFallback);
    const timestamp = now().toISOString();

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return createValidationErrorResponse({
        requestId,
        timestamp,
        fields: {
          body: ["invalidPayload"],
        },
      });
    }

    const payloadValidation = validateBugReportPayload(body);

    if (!payloadValidation.ok) {
      return createValidationErrorResponse({
        requestId,
        timestamp,
        fields: payloadValidation.fields,
      });
    }

    try {
      const payload = payloadValidation.value;
      const observability = readObservabilityConfig();

      if (observability.enabled) {
        console.info(
          JSON.stringify({
            level: "info",
            category: "bug_report_received",
            timestamp,
            requestId,
            route: payload.route,
            submittedAt: payload.timestamp,
            reportRequestId: payload.requestId,
            hasNotes: Boolean(payload.notes),
          }),
        );
      }

      return NextResponse.json<ApiSuccess<{ accepted: true }>>(
        {
          data: {
            accepted: true,
          },
          meta: {
            requestId,
            timestamp,
          },
        },
        {
          status: 202,
          headers: {
            "x-request-id": requestId,
          },
        },
      );
    } catch (error) {
      logError({
        timestamp,
        message: "Bug report route failed.",
        requestId,
        route: "/api/bug-report",
        method: request.method,
        error: {
          code: "INTERNAL_ERROR",
          status: 500,
          name: error instanceof Error ? error.name : undefined,
        },
      });

      captureException(error, {
        requestId,
        route: "/api/bug-report",
        method: request.method,
        errorCode: "INTERNAL_ERROR",
      });

      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred.",
            status: 500,
          },
          meta: {
            requestId,
            timestamp,
          },
        },
        {
          status: 500,
          headers: {
            "x-request-id": requestId,
          },
        },
      );
    }
  };
}

const defaultPostRoute = createBugReportPostRoute();

export async function POST(request: Request) {
  return defaultPostRoute(request);
}

function createValidationErrorResponse({
  requestId,
  timestamp,
  fields,
}: {
  requestId: string;
  timestamp: string;
  fields: BugReportValidationFields;
}) {
  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        code: "REQUEST_VALIDATION_FAILED",
        message: "Request validation failed.",
        status: 400,
        details: {
          fields,
        },
      },
      meta: {
        requestId,
        timestamp,
      },
    },
    {
      status: 400,
      headers: {
        "x-request-id": requestId,
      },
    },
  );
}
