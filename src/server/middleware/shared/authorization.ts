import { AuthorizationMiddlewareError } from "@/server/middleware/shared/errors";

export function assertAuthorized(
  allowed: boolean,
  message = "You are not allowed to access this resource.",
): void {
  if (!allowed) {
    throw new AuthorizationMiddlewareError(message);
  }
}
