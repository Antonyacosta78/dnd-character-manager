import { SchemaValidationMiddlewareError } from "@/server/middleware/shared/errors";
import type { MiddlewareValidationResult } from "@/server/middleware/shared/types";

export function assertValid<TValue, TDetails = Record<string, unknown>>(
  result: MiddlewareValidationResult<TValue, TDetails>,
): TValue {
  if (!result.ok) {
    throw new SchemaValidationMiddlewareError({
      code: result.code,
      message: result.message,
      details:
        result.details && typeof result.details === "object"
          ? (result.details as Record<string, unknown>)
          : undefined,
    });
  }

  return result.value;
}

export async function parseJsonWith<TValue, TDetails = Record<string, unknown>>(
  request: Request,
  validator: (body: unknown) => MiddlewareValidationResult<TValue, TDetails>,
): Promise<TValue> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new SchemaValidationMiddlewareError({
      code: "REQUEST_VALIDATION_FAILED",
      message: "Request validation failed.",
      details: {
        fields: {
          body: ["invalidPayload"],
        },
      },
    });
  }

  return assertValid(validator(body));
}
