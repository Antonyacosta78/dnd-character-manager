"use client";

import { useEffect } from "react";

import { initializeClientObservability } from "@/client/observability/sentry-client";

export function ObservabilityBootstrap() {
  useEffect(() => {
    initializeClientObservability();
  }, []);

  return null;
}
