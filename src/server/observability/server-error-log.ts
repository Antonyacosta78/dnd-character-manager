import { readObservabilityConfig } from "@/server/composition/app-config";
import type { ErrorCode } from "@/server/observability/error-code-map";

export interface ServerErrorLog {
  level: "error";
  timestamp: string;
  message: string;
  requestId: string;
  route: string;
  method?: string;
  error: {
    code: ErrorCode;
    status?: number;
    name?: string;
  };
  runtime: {
    environment: string;
    release?: string;
  };
}

export interface BuildServerErrorLogInput {
  timestamp: string;
  message: string;
  requestId: string;
  route: string;
  method?: string;
  error: {
    code: ErrorCode;
    status?: number;
    name?: string;
  };
}

function sanitizeLogMessage(message: string): string {
  return message.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 300);
}

export function buildServerErrorLog(input: BuildServerErrorLogInput): ServerErrorLog {
  const observability = readObservabilityConfig();

  return {
    level: "error",
    timestamp: input.timestamp,
    message: sanitizeLogMessage(input.message),
    requestId: input.requestId,
    route: input.route,
    method: input.method,
    error: {
      code: input.error.code,
      status: input.error.status,
      name: input.error.name,
    },
    runtime: {
      environment: observability.environment,
      release: observability.release,
    },
  };
}

export function emitServerErrorLog(input: BuildServerErrorLogInput): void {
  const structuredError = buildServerErrorLog(input);
  console.error(JSON.stringify(structuredError));
}
