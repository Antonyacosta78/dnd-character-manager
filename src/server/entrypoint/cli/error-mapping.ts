import { isServerError } from "@/server/errors";

export interface CliFailure {
  code: string;
  message: string;
  exitCode: number;
}

export function mapCliError(error: unknown): CliFailure {
  if (isServerError(error)) {
    return {
      code: error.code,
      message: error.message,
      exitCode: error.exitCode,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    exitCode: 3,
  };
}
