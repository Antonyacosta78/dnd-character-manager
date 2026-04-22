export const DRAFT_SCOPES = [
  "character-create",
  "character-sheet",
  "progression-plan",
  "branch-edit",
  "snapshot-prepare",
] as const;

export type DraftScope = (typeof DRAFT_SCOPES)[number];

export const DRAFT_SCHEMA_VERSION = 1;
export const DRAFT_SCOPE_RETENTION_LIMIT = 20;

export type DraftPayload = Record<string, unknown>;

export type DraftPersistenceTrigger = "blur" | "save" | "submit";

export interface DraftEnvelope<TData extends DraftPayload = DraftPayload> {
  scope: DraftScope;
  entityId: string;
  schemaVersion: number;
  updatedAt: string;
  data: TData;
  isDirty: boolean;
  baseRevision?: number;
  conflict?: {
    baseRevision: number;
    serverRevision: number;
    changedSections: string[];
  };
}

export interface DraftStoreState {
  byScope: Record<DraftScope, Record<string, DraftEnvelope>>;
  isHydrated: boolean;
}

export interface DraftStoreActions {
  rehydrate(scopes?: readonly DraftScope[]): void;
  loadDraft<TData extends DraftPayload = DraftPayload>(
    scope: DraftScope,
    entityId: string,
  ): DraftEnvelope<TData> | null;
  patchDraft<TData extends DraftPayload = DraftPayload>(
    scope: DraftScope,
    entityId: string,
    patch: Partial<TData>,
    trigger?: DraftPersistenceTrigger,
  ): void;
  clearDraft(scope: DraftScope, entityId: string): void;
  markSaved(
    scope: DraftScope,
    entityId: string,
    trigger?: Extract<DraftPersistenceTrigger, "save" | "submit">,
  ): void;
  setBaseRevision(
    scope: DraftScope,
    entityId: string,
    baseRevision: number,
    trigger?: Extract<DraftPersistenceTrigger, "save" | "submit">,
  ): void;
  markConflict(
    scope: DraftScope,
    entityId: string,
    conflict: {
      baseRevision: number;
      serverRevision: number;
      changedSections: string[];
    },
    trigger?: Extract<DraftPersistenceTrigger, "save" | "submit">,
  ): void;
  clearConflict(
    scope: DraftScope,
    entityId: string,
    trigger?: Extract<DraftPersistenceTrigger, "save" | "submit">,
  ): void;
}

export type DraftStore = DraftStoreState & DraftStoreActions;
