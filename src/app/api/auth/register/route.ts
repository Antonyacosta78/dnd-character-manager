import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "@/auth";

type RegisterField = "username" | "password" | "email" | "body";
type RegisterValidationIssue = "required" | "invalidType" | "invalidFormat" | "duplicate" | "invalidPayload";

interface RegisterBody {
  username: string;
  password: string;
  email: string | null;
}

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
      fields?: Partial<Record<RegisterField, RegisterValidationIssue[]>>;
    };
  };
  meta: ResponseMeta;
}

type CreateAccount = (input: RegisterBody, requestHeaders: Headers) => Promise<void>;

export interface RegisterRouteDeps {
  createAccount: CreateAccount;
  now?: () => Date;
  createRequestId?: () => string;
}

export function createRegisterPostRoute({
  createAccount,
  now = () => new Date(),
  createRequestId = () => `req_${randomUUID()}`,
}: RegisterRouteDeps) {
  return async function POST(request: Request) {
    const requestId = resolveRequestId(request, createRequestId);
    const timestamp = now().toISOString();

    const parsedBody = await parseRequestBody(request);

    if (!parsedBody.ok) {
      return createValidationErrorResponse({
        requestId,
        timestamp,
        fields: parsedBody.fields,
      });
    }

    const payloadValidation = validateRegisterBody(parsedBody.body);

    if (!payloadValidation.ok) {
      return createValidationErrorResponse({
        requestId,
        timestamp,
        fields: payloadValidation.fields,
      });
    }

    try {
      await createAccount(payloadValidation.value, request.headers);

      return NextResponse.json<ApiSuccess<{ created: true }>>(
        {
          data: {
            created: true,
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
      if (isDuplicateUsernameError(error)) {
        return createValidationErrorResponse({
          requestId,
          timestamp,
          fields: {
            username: ["duplicate"],
          },
        });
      }

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

const defaultPostRoute = createRegisterPostRoute({
  createAccount: createAccountWithAuthProvider,
});

export async function POST(request: Request) {
  return defaultPostRoute(request);
}

function resolveRequestId(request: Request, fallback: () => string) {
  const requestId = request.headers.get("x-request-id");

  if (!requestId) {
    return fallback();
  }

  const isSafeRequestId = /^[A-Za-z0-9._:-]{1,120}$/.test(requestId);

  return isSafeRequestId ? requestId : fallback();
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

  if (rawEmail !== undefined && rawEmail !== null && typeof rawEmail !== "string") {
    fields.email = ["invalidType"];
  }

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      fields,
    };
  }

  const username = (rawUsername as string).trim();
  const password = rawPassword as string;
  const email = typeof rawEmail === "string" ? rawEmail.trim() : null;

  if (username.length === 0) {
    fields.username = ["required"];
  }

  if (password.trim().length === 0) {
    fields.password = ["required"];
  }

  if (email && !isValidEmail(email)) {
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
      email: email || null,
    },
  };
}

async function createAccountWithAuthProvider(input: RegisterBody, requestHeaders: Headers): Promise<void> {
  const authApi = auth.api as Record<string, unknown>;
  const signUpUsername = authApi.signUpUsername;
  const signUpEmail = authApi.signUpEmail;

  if (typeof signUpUsername === "function") {
    const result = await signUpUsername({
      body: {
        username: input.username,
        password: input.password,
        email: input.email ?? undefined,
        name: input.username,
      },
      headers: requestHeaders,
    });

    assertAuthResultSucceeded(result);

    return;
  }

  if (typeof signUpEmail === "function") {
    const result = await signUpEmail({
      body: {
        email: input.email ?? undefined,
        password: input.password,
        username: input.username,
        name: input.username,
      },
      headers: requestHeaders,
    });

    assertAuthResultSucceeded(result);

    return;
  }

  throw new Error("Auth provider registration API is unavailable.");
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

function createValidationErrorResponse({
  requestId,
  timestamp,
  fields,
}: {
  requestId: string;
  timestamp: string;
  fields: Partial<Record<RegisterField, RegisterValidationIssue[]>>;
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
