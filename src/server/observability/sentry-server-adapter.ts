import * as Sentry from "@sentry/nextjs";

import { registerServerSentryAdapter } from "@/server/observability/sentry-server";

registerServerSentryAdapter({
  init: () => {},
  captureException: (error, context) => {
    Sentry.withScope((scope) => {
      scope.setTag("requestId", context.requestId);
      scope.setTag("route", context.route);

      if (context.method) {
        scope.setTag("method", context.method);
      }

      if (context.errorCode) {
        scope.setTag("errorCode", context.errorCode);
      }

      Sentry.captureException(error);
    });
  },
});
