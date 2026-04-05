export interface CharacterSummary {
  id: string;
  name: string;
  ownerUserId: string;
  updatedAt: Date;
}

export interface CharacterClassRef {
  name: string;
  source: string;
}

export interface CharacterCatalogRef {
  name: string;
  source: string;
}

export interface CharacterInventoryEntry {
  id: string;
  label: string;
  quantity: number;
  carriedState: "carried" | "stored";
  weight?: number;
  notes?: string;
  catalogRef?: CharacterCatalogRef;
  isCustom?: boolean;
}

export interface CharacterSpellEntry {
  id: string;
  label: string;
  level?: number;
  status: "known" | "prepared" | "always";
  notes?: string;
  catalogRef?: CharacterCatalogRef;
  isCustom?: boolean;
}

export interface CharacterLevelHistoryEntry {
  id: string;
  levelNumber: number;
  classRef: CharacterCatalogRef;
  notes?: string;
  createdAt: Date;
}

export interface CharacterShareSettings {
  shareEnabled: boolean;
  shareToken: string | null;
  updatedAt: Date;
}

export interface CharacterDraftPayload {
  name: string;
  concept: string;
  classRef: CharacterClassRef;
  level: number;
  notes?: string;
  inventory?: CharacterInventoryEntry[];
  spells?: CharacterSpellEntry[];
  optionalRuleRefs?: CharacterCatalogRef[];
}

export interface CharacterValidationOverride {
  code: string;
  path: string;
  acknowledgedAt: Date;
}

export interface CharacterBuildState {
  concept: string;
  classRef: CharacterClassRef;
  level: number;
  notes?: string;
  optionalRuleRefs?: CharacterCatalogRef[];
}

export interface CharacterAggregate {
  id: string;
  ownerUserId: string;
  name: string;
  status: string;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
  buildState: CharacterBuildState;
  warningOverrides: CharacterValidationOverride[];
  inventory?: CharacterInventoryEntry[];
  spells?: CharacterSpellEntry[];
  levelHistory?: CharacterLevelHistoryEntry[];
  shareSettings?: CharacterShareSettings;
}

export interface CreateCharacterInput {
  ownerUserId: string;
  draft: CharacterDraftPayload;
  acknowledgedWarningCodes: string[];
}

export interface SaveCharacterInput {
  characterId: string;
  ownerUserId: string;
  baseRevision: number;
  draft: CharacterDraftPayload;
  acknowledgedWarningCodes: string[];
}

export interface FinalizeLevelUpInput {
  characterId: string;
  ownerUserId: string;
  baseRevision: number;
  classRef: CharacterCatalogRef;
  levelNumber: number;
  notes?: string;
}

export interface SetCharacterShareEnabledInput {
  characterId: string;
  ownerUserId: string;
  enabled: boolean;
}

export type CharacterChangedSection = "core" | "progression" | "inventory" | "spells" | "notes";

export interface SaveCharacterConflict {
  kind: "conflict";
  characterId: string;
  baseRevision: number;
  serverRevision: number;
  changedSections: CharacterChangedSection[];
}

export interface SaveCharacterSuccess {
  kind: "saved";
  character: CharacterAggregate;
}

export type SaveCharacterResult = SaveCharacterSuccess | SaveCharacterConflict;

export interface CharacterRepository {
  listByOwner(ownerUserId: string): Promise<CharacterSummary[]>;
  createCharacter(input: CreateCharacterInput): Promise<CharacterAggregate>;
  getByIdForOwner(characterId: string, ownerUserId: string): Promise<CharacterAggregate | null>;
  getByShareToken(shareToken: string): Promise<CharacterAggregate | null>;
  saveCanonical(input: SaveCharacterInput): Promise<SaveCharacterResult>;
  finalizeLevelUp(input: FinalizeLevelUpInput): Promise<SaveCharacterResult>;
  setShareEnabled(input: SetCharacterShareEnabledInput): Promise<CharacterShareSettings>;
}
