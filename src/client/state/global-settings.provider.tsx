"use client";

import { useEffect } from "react";

import { globalSettingsStore } from "@/client/state/global-settings.store";

type GlobalSettingsProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export function GlobalSettingsProvider({ children }: GlobalSettingsProviderProps) {
  useEffect(() => {
    void globalSettingsStore.getState().rehydrate();
  }, []);

  return <>{children}</>;
}
