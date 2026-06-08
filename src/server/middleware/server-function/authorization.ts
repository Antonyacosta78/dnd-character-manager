import { assertAuthorized } from "@/server/middleware/shared/authorization";
import type { ServerFunctionEntrypointContext } from "@/server/middleware/shared/types";

export interface ServerFunctionAuthorizationOptions {
  message?: string;
}

export function withAuthorization<TInput, TOutput>(
  check: (input: {
    input: TInput;
    context: ServerFunctionEntrypointContext;
  }) => boolean | Promise<boolean>,
  handler: (
    input: TInput,
    context?: ServerFunctionEntrypointContext,
  ) => Promise<TOutput> | TOutput,
  options: ServerFunctionAuthorizationOptions = {},
) {
  return async function authorizedServerFunction(
    input: TInput,
    context: ServerFunctionEntrypointContext = {},
  ): Promise<TOutput> {
    const allowed = await check({ input, context });
    assertAuthorized(allowed, options.message);
    return handler(input, context);
  };
}
