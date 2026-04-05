export interface ClientSentryContext {
  route: string;
  requestId?: string;
  errorCode?: string;
}

interface ClientSentryAdapter {
  init: (config: {
    dsn: string;
    environment: string;
    release: string;
  }) => void;
  captureException: (error: unknown, context: ClientSentryContext) => void;
}

interface ClientObservabilityConfig {
  enabled: boolean;
  environment: string;
  release: string;
  clientDsn?: string;
}

let adapter: ClientSentryAdapter | null = null;
let initialized = false;

export function registerClientSentryAdapter(nextAdapter: ClientSentryAdapter): void {
  adapter = nextAdapter;
  initialized = false;
}

function resolveEnvironment(): string {
  const explicit = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim();

  if (explicit) {
    return explicit;
  }

  const appEnv = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();

  if (appEnv === "staging" || appEnv === "production" || appEnv === "development") {
    return appEnv;
  }

  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function parseEnabledFlag(environment: string): boolean {
  const explicit = process.env.NEXT_PUBLIC_OBSERVABILITY_ENABLED?.trim().toLowerCase();

  if (explicit === "true") {
    return true;
  }

  if (explicit === "false") {
    return false;
  }

  return environment === "staging" || environment === "production";
}

function readClientObservabilityConfig(): ClientObservabilityConfig {
  const environment = resolveEnvironment();

  return {
    enabled: parseEnabledFlag(environment),
    environment,
    release:
      process.env.NEXT_PUBLIC_SENTRY_RELEASE?.trim() ||
      process.env.NEXT_PUBLIC_GIT_COMMIT_SHA?.trim() ||
      "0.1.0",
    clientDsn: process.env.NEXT_PUBLIC_SENTRY_DSN?.trim(),
  };
}

function ensureInitialized(): boolean {
  const config = readClientObservabilityConfig();

  if (!config.enabled || !config.clientDsn || !adapter) {
    return false;
  }

  if (!initialized) {
    adapter.init({
      dsn: config.clientDsn,
      environment: config.environment,
      release: config.release,
    });
    initialized = true;
  }

  return true;
}

export function captureClientException(error: unknown, context: ClientSentryContext): void {
  if (!ensureInitialized() || !adapter) {
    return;
  }

  try {
    adapter.captureException(error, context);
  } catch {
    console.warn("telemetry_capture_failed");
  }
}

export function initializeClientObservability(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!(window as Window & { __dcmObservabilityInitialized?: boolean }).__dcmObservabilityInitialized) {
    (window as Window & { __dcmObservabilityInitialized?: boolean }).__dcmObservabilityInitialized = true;

    window.addEventListener("error", (event) => {
      captureClientException(event.error ?? event.message, {
        route: window.location.pathname,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      captureClientException(event.reason, {
        route: window.location.pathname,
      });
    });
  }
}
