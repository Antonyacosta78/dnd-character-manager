import { assertValid } from "@/server/middleware/shared/schema-validation";
import type {
  MiddlewareValidationResult,
  ServerFunctionEntrypointContext,
} from "@/server/middleware/shared/types";

export function withSchemaValidation<TInput, TValidated, TOutput>(
  validator: (input: TInput) => MiddlewareValidationResult<TValidated>,
  handler: (
    input: TInput,
    context?: ServerFunctionEntrypointContext,
  ) => Promise<TOutput> | TOutput,
) {
  return async function validatedServerFunction(
    input: TInput,
    context: ServerFunctionEntrypointContext = {},
  ): Promise<TOutput> {
    const validatedInput = assertValid(validator(input));
    return handler(input, {
      ...context,
      validatedInput,
    });
  };
}
