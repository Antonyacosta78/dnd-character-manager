import { stack } from "@nextwrappers/core";

import {
  createResponseMeta,
  createRestErrorResponse,
  createRestSuccessResponse,
  type ApiErrorBody,
  mapRestError,
} from "@/server/entrypoint/api/rest-contract";
import { schemaValidation } from "@/server/middleware/api/schema-validation";
import type { MiddlewareValidationResult } from "@/server/middleware/shared/types";
import {
  SessionService,
  type RegisterAccountInput,
  type RegisterAccountResult,
} from "@/server/services/session";

type RegisterField = "username" | "password" | "email" | "body";
type RegisterValidationIssue =
  | "required"
  | "invalidType"
  | "invalidFormat"
  | "duplicate"
  | "invalidPayload";

type CreateAccount = (
  input: RegisterAccountInput,
  requestHeaders: Headers,
) => Promise<RegisterAccountResult>;

export interface RegisterApiEntrypointDeps {
  createAccount: CreateAccount;
  now?: () => Date;
  createRequestId?: () => string;
}

export function createRegisterPostRoute({
  createAccount,
  now,
  createRequestId,
}: RegisterApiEntrypointDeps) {
  return async function POST(request: Request) {
    const meta = createResponseMeta(request, { now, createRequestId });
    const handler = stack(schemaValidation(validateRegisterBody))(async (_request, ext) => {
      const validatedInput = (ext as { validatedInput?: unknown } | undefined)
        ?.validatedInput as RegisterAccountInput;
      const creationResult = await createAccount(validatedInput, request.headers);
      const response = createRestSuccessResponse({
        data: {
          created: true,
        },
        meta,
      });

      for (const setCookieHeader of creationResult.setCookieHeaders) {
        response.headers.append("set-cookie", setCookieHeader);
      }

      return response;
    });

    try {
      return await handler(request);
    } catch (error) {
      if (isDuplicateUsernameError(error)) {
        return createValidationErrorResponse({
          meta,
          fields: {
            username: ["duplicate"],
          },
        });
      }

      if (isPasswordConstraintError(error)) {
        return createValidationErrorResponse({
          meta,
          fields: {
            password: ["invalidFormat"],
          },
        });
      }

      return createRestErrorResponse({
        error: mapRestError(error),
        meta,
      });
    }
  };
}

const defaultPostRoute = createRegisterPostRoute({
  createAccount: (input, requestHeaders) => SessionService.registerAccount(input, requestHeaders),
});

/** @implements POST /api/auth/register */
export async function POST(request: Request) {
  return defaultPostRoute(request);
}

function validateRegisterBody(
  body: unknown,
): MiddlewareValidationResult<
  RegisterAccountInput,
  { fields: Partial<Record<RegisterField, RegisterValidationIssue[]>> }
> {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      details: {
        fields: {
          body: ["invalidPayload"],
        },
      },
    };
  }

  const fields: Partial<Record<RegisterField, RegisterValidationIssue[]>> = {};

  const rawUsername = body.username;
  const rawPassword = body.password;
  const rawEmail = body.email;

  if (typeof rawUsername !== "string") {
    fields.username = ["invalidType"];
  }

  if (typeof rawPassword !== "string") {
    fields.password = ["invalidType"];
  }

  if (rawEmail === undefined || rawEmail === null) {
    fields.email = ["required"];
  } else if (typeof rawEmail !== "string") {
    fields.email = ["invalidType"];
  }

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      details: {
        fields,
      },
    };
  }

  const username = rawUsername as string;
  const password = rawPassword as string;
  const email = rawEmail as string;

  if (username.length === 0) {
    fields.username = ["required"];
  }

  if (password.trim().length === 0) {
    fields.password = ["required"];
  } else if (password.length < 8) {
    fields.password = ["invalidFormat"];
  }

  if (email.length === 0) {
    fields.email = ["required"];
  } else if (!isValidEmail(email)) {
    fields.email = ["invalidFormat"];
  }

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      details: {
        fields,
      },
    };
  }

  return {
    ok: true,
    value: {
      username,
      password,
      email,
    },
  };
}

function createValidationErrorResponse(input: {
  meta: { requestId: string; timestamp: string };
  fields: Partial<Record<RegisterField, RegisterValidationIssue[]>>;
}) {
  return createRestErrorResponse({
    error: createValidationErrorBody(input.fields),
    meta: input.meta,
  });
}

function createValidationErrorBody(
  fields: Partial<Record<RegisterField, RegisterValidationIssue[]>>,
): ApiErrorBody<{ fields: Partial<Record<RegisterField, RegisterValidationIssue[]>> }> {
  return {
    code: "REQUEST_VALIDATION_FAILED",
    message: "Request validation failed.",
    status: 400,
    details: {
      fields,
    },
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isDuplicateUsernameError(error: unknown): boolean {
  const normalizedErrorText = extractErrorText(error).toLowerCase();

  if (!normalizedErrorText.includes("username")) {
    return false;
  }

  return (
    normalizedErrorText.includes("already") ||
    normalizedErrorText.includes("exists") ||
    normalizedErrorText.includes("duplicate") ||
    normalizedErrorText.includes("unique") ||
    normalizedErrorText.includes("taken")
  );
}

function isPasswordConstraintError(error: unknown): boolean {
  const normalizedErrorText = extractErrorText(error).toLowerCase();

  if (!normalizedErrorText.includes("password")) {
    return false;
  }

  return (
    normalizedErrorText.includes("too short") ||
    normalizedErrorText.includes("at least") ||
    normalizedErrorText.includes("min")
  );
}

function extractErrorText(error: unknown): string {
  if (!error) {
    return "";
  }

  const parts: string[] = [];
  const queue: unknown[] = [error];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const candidate = queue.shift();

    if (candidate === undefined || candidate === null || visited.has(candidate)) {
      continue;
    }

    visited.add(candidate);

    if (typeof candidate === "string") {
      parts.push(candidate);
      continue;
    }

    if (typeof candidate === "number" || typeof candidate === "boolean") {
      parts.push(String(candidate));
      continue;
    }

    if (candidate instanceof Error) {
      queue.push(candidate.name, candidate.message, candidate.cause);
      continue;
    }

    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        queue.push(item);
      }
      continue;
    }

    if (typeof candidate === "object") {
      for (const value of Object.values(candidate)) {
        queue.push(value);
      }
    }
  }

  return parts.join(" ");
}
