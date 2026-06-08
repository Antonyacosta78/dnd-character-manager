import type { SessionContext } from "@/server/services/session";

export interface MiddlewareValidationFailure<TDetails = Record<string, unknown>> {
  ok: false;
  code?: string;
  message?: string;
  details?: TDetails;
}

export interface MiddlewareValidationSuccess<TValue> {
  ok: true;
  value: TValue;
}

export type MiddlewareValidationResult<
  TValue,
  TDetails = Record<string, unknown>,
> = MiddlewareValidationFailure<TDetails> | MiddlewareValidationSuccess<TValue>;

export interface ApiEntrypointContext {
  params?: unknown;
  sessionContext?: SessionContext;
  validatedInput?: unknown;
}

export interface ServerFunctionEntrypointContext {
  params?: unknown;
  requestHeaders?: Headers;
  sessionContext?: SessionContext;
  validatedInput?: unknown;
}
