import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,120}$/;

export function createRequestId(): string {
  return `req_${randomUUID()}`;
}

export function isValidRequestId(value: unknown): value is string {
  return typeof value === "string" && REQUEST_ID_PATTERN.test(value);
}

export function resolveRequestId(request: Request, fallback: () => string = createRequestId): string {
  const requestId = request.headers.get(REQUEST_ID_HEADER);

  if (!requestId || !isValidRequestId(requestId)) {
    return fallback();
  }

  return requestId;
}
