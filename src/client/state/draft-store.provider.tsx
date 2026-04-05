"use client";

import { useEffect } from "react";

import { draftStore } from "@/client/state/draft-store";
import type { DraftScope } from "@/client/state/draft-store.types";

type DraftStoreProviderProps = Readonly<{
  children: React.ReactNode;
  scopes?: readonly DraftScope[];
}>;

export function DraftStoreProvider({
  children,
  scopes,
}: DraftStoreProviderProps) {
  useEffect(() => {
    draftStore.getState().rehydrate(scopes);
  }, [scopes]);

  return <>{children}</>;
}
