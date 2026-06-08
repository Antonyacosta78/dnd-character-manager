import { wrapper } from "@nextwrappers/core";

import { requireAuthenticatedSession } from "@/server/middleware/shared/authentication";
import type { ApiEntrypointContext } from "@/server/middleware/shared/types";
import {
  SessionService,
  type SessionServiceClass,
} from "@/server/services/session";

export interface ApiAuthenticationOptions {
  required?: boolean;
  sessionService?: SessionServiceClass;
}

export function authentication(options: ApiAuthenticationOptions = {}) {
  return wrapper<Request, ApiEntrypointContext>(async (next, request, ext = {}) => {
    const sessionService = options.sessionService ?? SessionService;
    const sessionContext = await sessionService.getSessionContextFromRequest(request);

    if (options.required !== false) {
      requireAuthenticatedSession(sessionContext);
    }

    return next(request, {
      ...ext,
      sessionContext,
    });
  });
}
