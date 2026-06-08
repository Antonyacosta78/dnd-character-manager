import { AuthenticationMiddlewareError } from "@/server/middleware/shared/errors";
import type { SessionContext } from "@/server/services/session";

export function requireAuthenticatedSession(
  sessionContext: SessionContext,
): SessionContext & { userId: string } {
  if (!sessionContext.userId) {
    throw new AuthenticationMiddlewareError();
  }

  return {
    ...sessionContext,
    userId: sessionContext.userId,
  };
}
