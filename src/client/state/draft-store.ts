import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

import {
  DRAFT_SCHEMA_VERSION,
  DRAFT_SCOPES,
  DRAFT_SCOPE_RETENTION_LIMIT,
  type DraftEnvelope,
  type DraftPayload,
  type DraftScope,
  type DraftStore,
} from "@/client/state/draft-store.types";
import {
  persistDraft,
  readPersistedDraft,
  readPersistedDraftsForScope,
  removePersistedDraft,
} from "@/client/state/draft-store.storage";

function createEmptyByScopeState(): Record<DraftScope, Record<string, DraftEnvelope>> {
  return {
    "character-create": {},
    "character-sheet": {},
    "progression-plan": {},
    "branch-edit": {},
    "snapshot-prepare": {},
  };
}

function parseUpdatedAt(value: string): number {
  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function compareDraftUpdatedAt(a: DraftEnvelope, b: DraftEnvelope): number {
  const delta = parseUpdatedAt(a.updatedAt) - parseUpdatedAt(b.updatedAt);

  if (delta !== 0) {
    return delta;
  }

  return a.entityId.localeCompare(b.entityId);
}

function pickNewerDraft(
  existing: DraftEnvelope | null,
  incoming: DraftEnvelope,
): DraftEnvelope {
  if (!existing) {
    return incoming;
  }

  const ordering = compareDraftUpdatedAt(existing, incoming);

  if (ordering > 0) {
    return existing;
  }

  if (ordering === 0) {
    return existing;
  }

  return incoming;
}

function enforceInMemoryScopeRetention(
  draftsByEntityId: Record<string, DraftEnvelope>,
): Record<string, DraftEnvelope> {
  const values = Object.values(draftsByEntityId);

  if (values.length <= DRAFT_SCOPE_RETENTION_LIMIT) {
    return draftsByEntityId;
  }

  const keep = values
    .sort(compareDraftUpdatedAt)
    .slice(values.length - DRAFT_SCOPE_RETENTION_LIMIT);

  return Object.fromEntries(
    keep.map((draft) => [draft.entityId, draft]),
  ) as Record<string, DraftEnvelope>;
}

function upsertScopeDraft(
  byScope: Record<DraftScope, Record<string, DraftEnvelope>>,
  envelope: DraftEnvelope,
): Record<DraftScope, Record<string, DraftEnvelope>> {
  const nextScopeDrafts = {
    ...byScope[envelope.scope],
    [envelope.entityId]: pickNewerDraft(
      byScope[envelope.scope][envelope.entityId] ?? null,
      envelope,
    ),
  };

  return {
    ...byScope,
    [envelope.scope]: enforceInMemoryScopeRetention(nextScopeDrafts),
  };
}

function writeScopeDraft(
  byScope: Record<DraftScope, Record<string, DraftEnvelope>>,
  envelope: DraftEnvelope,
): Record<DraftScope, Record<string, DraftEnvelope>> {
  const nextScopeDrafts = {
    ...byScope[envelope.scope],
    [envelope.entityId]: envelope,
  };

  return {
    ...byScope,
    [envelope.scope]: enforceInMemoryScopeRetention(nextScopeDrafts),
  };
}

function createDraftEnvelope(
  scope: DraftScope,
  entityId: string,
  patch: Partial<DraftPayload>,
  existing: DraftEnvelope | null,
  updatedAt: string,
): DraftEnvelope {
  return {
    scope,
    entityId,
    schemaVersion: DRAFT_SCHEMA_VERSION,
    updatedAt,
    data: {
      ...(existing?.data ?? {}),
      ...patch,
    },
    isDirty: true,
  };
}

export function createDraftStore() {
  return createDraftStoreWithOptions();
}

interface CreateDraftStoreOptions {
  now?: () => Date;
}

export function createDraftStoreWithOptions(options: CreateDraftStoreOptions = {}) {
  const now = options.now ?? (() => new Date());

  return createStore<DraftStore>((set, get) => ({
    byScope: createEmptyByScopeState(),
    isHydrated: false,

    rehydrate(scopes = DRAFT_SCOPES) {
      set((state) => {
        let nextByScope = state.byScope;

        for (const scope of scopes) {
          const persistedDrafts = readPersistedDraftsForScope(scope);

          for (const envelope of persistedDrafts) {
            nextByScope = upsertScopeDraft(nextByScope, envelope);
          }
        }

        return {
          ...state,
          byScope: nextByScope,
          isHydrated: true,
        };
      });
    },

    loadDraft<TData extends DraftPayload = DraftPayload>(
      scope: DraftScope,
      entityId: string,
    ) {
      const persisted = readPersistedDraft(scope, entityId);

      if (persisted) {
        set((state) => ({
          ...state,
          byScope: upsertScopeDraft(state.byScope, persisted),
        }));
      }

      const current = get().byScope[scope][entityId] ?? null;

      return current as DraftEnvelope<TData> | null;
    },

    patchDraft(scope, entityId, patch, trigger) {
      const current = get().byScope[scope][entityId] ?? null;
      const nextEnvelope = createDraftEnvelope(
        scope,
        entityId,
        patch as Partial<DraftPayload>,
        current,
        now().toISOString(),
      );

      set((state) => ({
        ...state,
        byScope: writeScopeDraft(state.byScope, nextEnvelope),
      }));

      if (trigger) {
        persistDraft(nextEnvelope);
      }
    },

    clearDraft(scope, entityId) {
      set((state) => {
        const remainingScopeDrafts = { ...state.byScope[scope] };
        delete remainingScopeDrafts[entityId];

        return {
          ...state,
          byScope: {
            ...state.byScope,
            [scope]: remainingScopeDrafts,
          },
        };
      });

      removePersistedDraft(scope, entityId);
    },

    markSaved(scope, entityId, trigger = "submit") {
      const current = get().byScope[scope][entityId] ?? null;

      if (!current) {
        return;
      }

      const nextEnvelope: DraftEnvelope = {
        ...current,
        updatedAt: now().toISOString(),
        isDirty: false,
        conflict: undefined,
      };

      set((state) => ({
        ...state,
        byScope: writeScopeDraft(state.byScope, nextEnvelope),
      }));

      if (trigger) {
        persistDraft(nextEnvelope);
      }
    },

    setBaseRevision(scope, entityId, baseRevision, trigger = "submit") {
      const current = get().byScope[scope][entityId] ?? null;

      if (!current) {
        return;
      }

      const nextEnvelope: DraftEnvelope = {
        ...current,
        updatedAt: now().toISOString(),
        baseRevision,
      };

      set((state) => ({
        ...state,
        byScope: writeScopeDraft(state.byScope, nextEnvelope),
      }));

      if (trigger) {
        persistDraft(nextEnvelope);
      }
    },

    markConflict(scope, entityId, conflict, trigger = "save") {
      const current = get().byScope[scope][entityId] ?? null;

      if (!current) {
        return;
      }

      const nextEnvelope: DraftEnvelope = {
        ...current,
        updatedAt: now().toISOString(),
        conflict,
      };

      set((state) => ({
        ...state,
        byScope: writeScopeDraft(state.byScope, nextEnvelope),
      }));

      if (trigger) {
        persistDraft(nextEnvelope);
      }
    },

    clearConflict(scope, entityId, trigger = "save") {
      const current = get().byScope[scope][entityId] ?? null;

      if (!current) {
        return;
      }

      const nextEnvelope: DraftEnvelope = {
        ...current,
        updatedAt: now().toISOString(),
        conflict: undefined,
      };

      set((state) => ({
        ...state,
        byScope: writeScopeDraft(state.byScope, nextEnvelope),
      }));

      if (trigger) {
        persistDraft(nextEnvelope);
      }
    },
  }));
}

export const draftStore = createDraftStore();

export function useDraftStore<TSelected>(
  selector: (state: DraftStore) => TSelected,
): TSelected {
  return useStore(draftStore, selector);
}

export function getDraftStoreState(): DraftStore {
  return draftStore.getState();
}
