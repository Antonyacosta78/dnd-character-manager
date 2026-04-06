"use client";

import * as Sentry from "@sentry/nextjs";

import { registerClientSentryAdapter } from "@/client/observability/sentry-client";

registerClientSentryAdapter({
  init: () => {},
  captureException: (error, context) => {
    Sentry.withScope((scope) => {
      scope.setTag("route", context.route);

      if (context.requestId) {
        scope.setTag("requestId", context.requestId);
      }

      if (context.errorCode) {
        scope.setTag("errorCode", context.errorCode);
      }

      Sentry.captureException(error);
    });
  },
});
