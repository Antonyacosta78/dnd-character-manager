import { SessionServiceError } from "@/server/errors";

export { SessionServiceError };

export class SessionResolutionError extends SessionServiceError {
  constructor(message = "Failed to resolve session context.", cause?: unknown) {
    super({
      code: "SESSION_RESOLUTION_FAILED",
      status: 500,
      exitCode: 3,
      message,
      cause,
    });
  }
}

export class SessionProviderUnavailableError extends SessionServiceError {
  constructor(message = "Session provider is unavailable.", cause?: unknown) {
    super({
      code: "SESSION_PROVIDER_UNAVAILABLE",
      status: 503,
      exitCode: 3,
      message,
      cause,
    });
  }
}
