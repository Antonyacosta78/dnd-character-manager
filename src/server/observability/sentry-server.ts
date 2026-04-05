import { readObservabilityConfig } from "@/server/composition/app-config";
import type { ErrorCode } from "@/server/observability/error-code-map";

export interface ServerSentryContext {
  requestId: string;
  route: string;
  method?: string;
  errorCode?: ErrorCode;
}

interface SentryServerAdapter {
  init: (config: {
    dsn: string;
    environment: string;
    release: string;
  }) => void;
  captureException: (error: unknown, context: ServerSentryContext) => void;
}

let adapter: SentryServerAdapter | null = null;
let initialized = false;

export function registerServerSentryAdapter(nextAdapter: SentryServerAdapter): void {
  adapter = nextAdapter;
  initialized = false;
}

function ensureInitialized(): boolean {
  const observability = readObservabilityConfig();

  if (!observability.sentry.serverCaptureEnabled || !observability.sentry.dsn || !adapter) {
    return false;
  }

  if (!initialized) {
    adapter.init({
      dsn: observability.sentry.dsn,
      environment: observability.environment,
      release: observability.release,
    });
    initialized = true;
  }

  return true;
}

export function captureServerException(error: unknown, context: ServerSentryContext): void {
  if (!ensureInitialized() || !adapter) {
    return;
  }

  try {
    adapter.captureException(error, context);
  } catch {
    console.warn("telemetry_capture_failed");
  }
}
