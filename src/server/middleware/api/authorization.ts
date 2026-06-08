import { wrapper } from "@nextwrappers/core";

import { assertAuthorized } from "@/server/middleware/shared/authorization";
import type { ApiEntrypointContext } from "@/server/middleware/shared/types";

export interface ApiAuthorizationOptions {
  message?: string;
}

export function authorization(
  check: (input: {
    request: Request;
    context: ApiEntrypointContext;
  }) => boolean | Promise<boolean>,
  options: ApiAuthorizationOptions = {},
) {
  return wrapper<Request, ApiEntrypointContext>(async (next, request, ext = {}) => {
    const allowed = await check({
      request,
      context: ext,
    });

    assertAuthorized(allowed, options.message);

    return next(request, ext);
  });
}
