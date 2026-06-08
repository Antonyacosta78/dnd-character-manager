import {
  createResponseMeta,
  createRestErrorResponse,
} from "@/server/entrypoint/api/rest-contract";
import { NotImplementedEntrypointError } from "@/server/errors";

export function createNotImplementedApiRoute(message: string) {
  return async function notImplementedApiRoute(request: Request): Promise<Response> {
    const meta = createResponseMeta(request);

    return createRestErrorResponse({
      error: {
        code: new NotImplementedEntrypointError({
          code: "NOT_IMPLEMENTED",
          message,
        }).code,
        message,
        status: 501,
      },
      meta,
    });
  };
}
