export type DraftScope =
  | "character-create"
  | "progression-plan"
  | "branch-edit"
  | "snapshot-prepare";

export interface DraftRecord {
  scope: DraftScope;
  entityId: string;
  schemaVersion: number;
  updatedAt: Date;
  data: Record<string, unknown>;
  isDirty: boolean;
}

export interface SaveDraftInput {
  scope: DraftScope;
  entityId: string;
  schemaVersion: number;
  updatedAt: Date;
  data: Record<string, unknown>;
  isDirty: boolean;
}

export interface LoadDraftInput {
  scope: DraftScope;
  entityId: string;
}

export interface DraftRepository {
  save(input: SaveDraftInput): Promise<DraftRecord>;
  load(input: LoadDraftInput): Promise<DraftRecord | null>;
}
