import { wrapper } from "@nextwrappers/core";

import type {
  ApiEntrypointContext,
  MiddlewareValidationResult,
} from "@/server/middleware/shared/types";
import { parseJsonWith } from "@/server/middleware/shared/schema-validation";

export function schemaValidation<TValue, TDetails = Record<string, unknown>>(
  validator: (body: unknown) => MiddlewareValidationResult<TValue, TDetails>,
) {
  return wrapper<Request, ApiEntrypointContext>(async (next, request, ext = {}) => {
    const validatedInput = await parseJsonWith(request, validator);

    return next(request, {
      ...ext,
      validatedInput,
    });
  });
}
