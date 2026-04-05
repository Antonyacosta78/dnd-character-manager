"use client";

import { useEffect } from "react";

import { syncBrowserLocalePreference } from "@/i18n/client-locale-convergence";

export function LocalePreferenceConverger() {
  useEffect(() => {
    syncBrowserLocalePreference();
  }, []);

  return null;
}
