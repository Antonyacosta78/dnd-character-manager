import { auth } from "@/auth";

import {
  createResponseMeta,
  createRestErrorResponse,
  createRestSuccessResponse,
  type ApiErrorBody,
  mapRestError,
} from "@/server/entrypoint/api/rest-contract";

type RegisterField = "username" | "password" | "email" | "body";
type RegisterValidationIssue =
  | "required"
  | "invalidType"
  | "invalidFormat"
  | "duplicate"
  | "invalidPayload";

interface RegisterBody {
  username: string;
  password: string;
  email: string;
}

interface AccountCreationResult {
  setCookieHeaders: string[];
}

type CreateAccount = (
  input: RegisterBody,
  requestHeaders: Headers,
) => Promise<AccountCreationResult>;

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

    const parsedBody = await parseRequestBody(request);

    if (!parsedBody.ok) {
      return createValidationErrorResponse({
        meta,
        fields: parsedBody.fields,
      });
    }

    const payloadValidation = validateRegisterBody(parsedBody.body);

    if (!payloadValidation.ok) {
      return createValidationErrorResponse({
        meta,
        fields: payloadValidation.fields,
      });
    }

    try {
      const creationResult = await createAccount(payloadValidation.value, request.headers);
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
  createAccount: createAccountWithAuthProvider,
});

/** @implements POST /api/auth/register */
export async function POST(request: Request) {
  return defaultPostRoute(request);
}

async function parseRequestBody(request: Request): Promise<
  | {
      ok: true;
      body: unknown;
    }
  | {
      ok: false;
      fields: Partial<Record<RegisterField, RegisterValidationIssue[]>>;
    }
> {
  try {
    const body = await request.json();

    return {
      ok: true,
      body,
    };
  } catch {
    return {
      ok: false,
      fields: {
        body: ["invalidPayload"],
      },
    };
  }
}

function validateRegisterBody(body: unknown):
  | {
      ok: true;
      value: RegisterBody;
    }
  | {
      ok: false;
      fields: Partial<Record<RegisterField, RegisterValidationIssue[]>>;
    } {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      fields: {
        body: ["invalidPayload"],
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
      fields,
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
      fields,
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

async function createAccountWithAuthProvider(
  input: RegisterBody,
  requestHeaders: Headers,
): Promise<AccountCreationResult> {
  const authApi = auth.api as Record<string, unknown>;
  const signUpUsername = authApi.signUpUsername;
  const signUpEmail = authApi.signUpEmail;

  if (typeof signUpUsername === "function") {
    const result = await signUpUsername({
      asResponse: true,
      body: {
        username: input.username,
        password: input.password,
        email: input.email,
        name: input.username,
      },
      headers: requestHeaders,
    });

    assertAuthResultSucceeded(result);

    return createSessionAfterRegistration(authApi, input, requestHeaders);
  }

  if (typeof signUpEmail === "function") {
    const result = await signUpEmail({
      asResponse: true,
      body: {
        email: input.email,
        password: input.password,
        username: input.username,
        name: input.username,
      },
      headers: requestHeaders,
    });

    assertAuthResultSucceeded(result);

    return createSessionAfterRegistration(authApi, input, requestHeaders);
  }

  throw new Error("Auth provider registration API is unavailable.");
}

async function createSessionAfterRegistration(
  authApi: Record<string, unknown>,
  input: RegisterBody,
  requestHeaders: Headers,
): Promise<AccountCreationResult> {
  const signInUsername = authApi.signInUsername;
  const signInEmail = authApi.signInEmail;

  if (typeof signInUsername === "function") {
    const result = await signInUsername({
      asResponse: true,
      body: {
        username: input.username,
        password: input.password,
      },
      headers: requestHeaders,
    });

    return resolveSessionCreationResult(result);
  }

  if (typeof signInEmail === "function") {
    const result = await signInEmail({
      asResponse: true,
      body: {
        email: input.email,
        password: input.password,
      },
      headers: requestHeaders,
    });

    return resolveSessionCreationResult(result);
  }

  throw new Error("Auth provider sign-in API is unavailable.");
}

function resolveSessionCreationResult(result: unknown): AccountCreationResult {
  assertAuthResultSucceeded(result);

  if (result instanceof Response) {
    return {
      setCookieHeaders: getSetCookieHeaders(result),
    };
  }

  return {
    setCookieHeaders: [],
  };
}

function getSetCookieHeaders(response: Response): string[] {
  const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };

  if (typeof responseHeaders.getSetCookie === "function") {
    return responseHeaders.getSetCookie().filter((value) => value.length > 0);
  }

  const singleSetCookieHeader = response.headers.get("set-cookie");

  if (!singleSetCookieHeader) {
    return [];
  }

  return [singleSetCookieHeader];
}

function assertAuthResultSucceeded(result: unknown): void {
  if (!result || typeof result !== "object") {
    return;
  }

  if (result instanceof Response) {
    if (!result.ok) {
      throw new Error(`Registration failed with status ${result.status}`);
    }

    return;
  }

  const maybeResult = result as { error?: unknown };

  if (maybeResult.error) {
    throw maybeResult.error;
  }
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
