"use client";

import { useEffect } from "react";

import "@/client/observability/sentry-client-adapter";
import { initializeClientObservability } from "@/client/observability/sentry-client";

export function ObservabilityBootstrap() {
  useEffect(() => {
    initializeClientObservability();
  }, []);

  return null;
}
