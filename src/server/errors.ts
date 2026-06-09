export type ServerErrorEntity =
  | "entrypoint"
  | "middleware"
  | "orchestration"
  | "core"
  | "db-service"
  | "session-service";

export interface ServerErrorInput {
  code: string;
  entity: ServerErrorEntity;
  status: number;
  exitCode: number;
  message: string;
  cause?: unknown;
}

export class ServerError extends Error {
  readonly code: string;
  readonly entity: ServerErrorEntity;
  readonly status: number;
  readonly exitCode: number;

  constructor(input: ServerErrorInput) {
    super(input.message, { cause: input.cause });
    this.name = this.constructor.name;
    this.code = input.code;
    this.entity = input.entity;
    this.status = input.status;
    this.exitCode = input.exitCode;
  }
}

interface FamilyErrorInput {
  code: string;
  status: number;
  exitCode: number;
  message: string;
  cause?: unknown;
}

export class EntrypointError extends ServerError {
  constructor(input: FamilyErrorInput) {
    super({ ...input, entity: "entrypoint" });
  }
}

export interface MiddlewareErrorInput extends FamilyErrorInput {
  details?: Record<string, unknown>;
}

export class MiddlewareError extends ServerError {
  readonly details?: Record<string, unknown>;

  constructor(input: MiddlewareErrorInput) {
    super({ ...input, entity: "middleware" });
    this.details = input.details;
  }
}

export class OrchestrationError extends ServerError {
  constructor(input: FamilyErrorInput) {
    super({ ...input, entity: "orchestration" });
  }
}

export class CoreError extends ServerError {
  constructor(input: FamilyErrorInput) {
    super({ ...input, entity: "core" });
  }
}

export class DbServiceError extends ServerError {
  constructor(input: FamilyErrorInput) {
    super({ ...input, entity: "db-service" });
  }
}

export class SessionServiceError extends ServerError {
  constructor(input: FamilyErrorInput) {
    super({ ...input, entity: "session-service" });
  }
}

export class AuthenticationMiddlewareError extends MiddlewareError {
  constructor(message = "Authentication is required.", cause?: unknown) {
    super({
      code: "AUTH_UNAUTHENTICATED",
      status: 401,
      exitCode: 1,
      message,
      cause,
    });
  }
}

export class AuthorizationMiddlewareError extends MiddlewareError {
  constructor(message = "You are not allowed to access this resource.", cause?: unknown) {
    super({
      code: "AUTH_FORBIDDEN",
      status: 403,
      exitCode: 1,
      message,
      cause,
    });
  }
}

export class SchemaValidationMiddlewareError extends MiddlewareError {
  constructor(input: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
    cause?: unknown;
  }) {
    super({
      code: input.code ?? "REQUEST_VALIDATION_FAILED",
      status: 400,
      exitCode: 1,
      message: input.message ?? "Request validation failed.",
      details: input.details,
      cause: input.cause,
    });
  }
}

export class NotFoundOrchestrationError extends OrchestrationError {
  constructor(input: { code: string; message: string; cause?: unknown }) {
    super({ ...input, status: 404, exitCode: 1 });
  }
}

export class ConflictOrchestrationError extends OrchestrationError {
  constructor(input: { code: string; message: string; cause?: unknown }) {
    super({ ...input, status: 409, exitCode: 1 });
  }
}

export class NotImplementedEntrypointError extends EntrypointError {
  constructor(input: { code: string; message: string; cause?: unknown }) {
    super({ ...input, status: 501, exitCode: 3 });
  }
}

export class UnexpectedEntrypointError extends EntrypointError {
  constructor(cause?: unknown) {
    super({
      code: "INTERNAL_ERROR",
      status: 500,
      exitCode: 3,
      message: "An unexpected error occurred.",
      cause,
    });
  }
}

export function isServerError(error: unknown): error is ServerError {
  return error instanceof ServerError;
}
