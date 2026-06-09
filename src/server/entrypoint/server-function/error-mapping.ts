import { isServerError } from "@/server/errors";

export interface ServerFunctionFailure {
  code: string;
  message: string;
  status: number;
}

export function mapServerFunctionError(error: unknown): ServerFunctionFailure {
  if (isServerError(error)) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    status: 500,
  };
}
