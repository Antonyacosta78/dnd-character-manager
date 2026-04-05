import type {
  DraftEnvelope,
  DraftPayload,
  DraftScope,
  DraftStore,
} from "@/client/state/draft-store.types";

export function selectIsDraftStoreHydrated(state: DraftStore): boolean {
  return state.isHydrated;
}

export function selectDraftEnvelope(
  state: DraftStore,
  scope: DraftScope,
  entityId: string,
): DraftEnvelope | null {
  return state.byScope[scope][entityId] ?? null;
}

export function selectDraftData<TData extends DraftPayload = DraftPayload>(
  state: DraftStore,
  scope: DraftScope,
  entityId: string,
): TData | null {
  const envelope = selectDraftEnvelope(state, scope, entityId);

  return (envelope?.data as TData | undefined) ?? null;
}

export function selectDraftIsDirty(
  state: DraftStore,
  scope: DraftScope,
  entityId: string,
): boolean {
  return selectDraftEnvelope(state, scope, entityId)?.isDirty ?? false;
}

export function createDraftEnvelopeSelector(scope: DraftScope, entityId: string) {
  return (state: DraftStore) => selectDraftEnvelope(state, scope, entityId);
}
