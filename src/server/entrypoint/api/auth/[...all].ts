import { NotImplementedEntrypointError } from "@/server/errors";
import {
  createResponseMeta,
  createRestErrorResponse,
  mapRestError,
} from "@/server/entrypoint/api/rest-contract";

function createBlockedAuthRoute(method: "GET" | "POST") {
  return async function authCatchAllRoute(request: Request) {
    const meta = createResponseMeta(request);

    return createRestErrorResponse({
      error: mapRestError(
        new NotImplementedEntrypointError({
          code: "AUTH_ROUTE_NOT_IMPLEMENTED",
          message:
            `${method} /api/auth/[...all] is blocked during Step 3 until in-house auth endpoints replace the provider catch-all.`,
        }),
      ),
      meta,
    });
  };
}

/** @implements GET /api/auth/[...all] */
export const GET = createBlockedAuthRoute("GET");

/** @implements POST /api/auth/[...all] */
export const POST = createBlockedAuthRoute("POST");
