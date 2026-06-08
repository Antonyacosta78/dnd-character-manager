import { requireAuthenticatedSession } from "@/server/middleware/shared/authentication";
import type { ServerFunctionEntrypointContext } from "@/server/middleware/shared/types";
import {
  SessionService,
  type SessionServiceClass,
} from "@/server/services/session";

export interface ServerFunctionAuthenticationOptions {
  required?: boolean;
  sessionService?: SessionServiceClass;
}

export function withAuthentication<TInput, TOutput>(
  handler: (
    input: TInput,
    context?: ServerFunctionEntrypointContext,
  ) => Promise<TOutput> | TOutput,
  options: ServerFunctionAuthenticationOptions = {},
) {
  return async function authenticatedServerFunction(
    input: TInput,
    context: ServerFunctionEntrypointContext = {},
  ): Promise<TOutput> {
    const sessionService = options.sessionService ?? SessionService;
    const requestHeaders = context.requestHeaders ?? new Headers();
    const sessionContext =
      context.sessionContext ??
      (await sessionService.getSessionContextFromHeaders(requestHeaders));

    if (options.required !== false) {
      requireAuthenticatedSession(sessionContext);
    }

    return handler(input, {
      ...context,
      sessionContext,
    });
  };
}
