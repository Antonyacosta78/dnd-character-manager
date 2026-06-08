import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { isServerError } from "@/server/errors";

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiSuccess<T> {
  data: T;
  meta: ResponseMeta;
}

export interface ApiErrorBody<TDetails = Record<string, unknown> | undefined> {
  code: string;
  message: string;
  status: number;
  details?: TDetails;
}

export interface ApiErrorResponse<TDetails = Record<string, unknown> | undefined> {
  error: ApiErrorBody<TDetails>;
  meta: ResponseMeta;
}

export function resolveRequestId(
  request: Request,
  fallback: () => string = () => `req_${randomUUID()}`,
): string {
  const requestId = request.headers.get("x-request-id");

  if (!requestId) {
    return fallback();
  }

  const isSafeRequestId = /^[A-Za-z0-9._:-]{1,120}$/.test(requestId);

  return isSafeRequestId ? requestId : fallback();
}

export function createResponseMeta(
  request: Request,
  options: {
    now?: () => Date;
    createRequestId?: () => string;
  } = {},
): ResponseMeta {
  return {
    requestId: resolveRequestId(request, options.createRequestId),
    timestamp: (options.now ?? (() => new Date()))().toISOString(),
  };
}

export function createRestSuccessResponse<T>(input: {
  data: T;
  meta: ResponseMeta;
  status?: number;
}): Response {
  const response = NextResponse.json<ApiSuccess<T>>(
    {
      data: input.data,
      meta: input.meta,
    },
    {
      status: input.status ?? 200,
    },
  );

  response.headers.set("x-request-id", input.meta.requestId);

  return response;
}

export function createRestErrorResponse<TDetails = Record<string, unknown> | undefined>(input: {
  error: ApiErrorBody<TDetails>;
  meta: ResponseMeta;
}): Response {
  const response = NextResponse.json<ApiErrorResponse<TDetails>>(
    {
      error: input.error,
      meta: input.meta,
    },
    {
      status: input.error.status,
    },
  );

  response.headers.set("x-request-id", input.meta.requestId);

  return response;
}

export function mapRestError(error: unknown): ApiErrorBody {
  if (isServerError(error)) {
    const details = "details" in error ? (error.details as Record<string, unknown> | undefined) : undefined;

    return {
      code: error.code,
      message: error.message,
      status: error.status,
      details,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    status: 500,
  };
}
