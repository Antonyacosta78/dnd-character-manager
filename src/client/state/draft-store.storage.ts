import {
  DRAFT_SCHEMA_VERSION,
  DRAFT_SCOPE_RETENTION_LIMIT,
  DRAFT_SCOPES,
  type DraftEnvelope,
  type DraftScope,
} from "@/client/state/draft-store.types";

const DRAFT_STORAGE_PREFIX = "dcm:draft";

type ParsedStorageKey = {
  scope: DraftScope;
  entityId: string;
  schemaVersion: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDraftScope(value: string): value is DraftScope {
  return DRAFT_SCOPES.includes(value as DraftScope);
}

function getStorage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }

  return globalThis.localStorage;
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

function parseStorageKey(key: string): ParsedStorageKey | null {
  const match = /^dcm:draft:([^:]+):([^:]+):v(\d+)$/.exec(key);

  if (!match) {
    return null;
  }

  const [, scopeCandidate, entityId, schemaVersionRaw] = match;

  if (!isDraftScope(scopeCandidate) || entityId.length === 0) {
    return null;
  }

  const schemaVersion = Number(schemaVersionRaw);

  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    return null;
  }

  return {
    scope: scopeCandidate,
    entityId,
    schemaVersion,
  };
}

function isDraftEnvelope(value: unknown): value is DraftEnvelope {
  if (!isRecord(value)) {
    return false;
  }

  const scope = value.scope;
  const entityId = value.entityId;
  const schemaVersion = value.schemaVersion;
  const updatedAt = value.updatedAt;
  const isDirty = value.isDirty;
  const baseRevision = value.baseRevision;
  const conflict = value.conflict;

  if (typeof scope !== "string" || !isDraftScope(scope)) {
    return false;
  }

  if (typeof entityId !== "string" || entityId.length === 0) {
    return false;
  }

  if (typeof schemaVersion !== "number" || !Number.isInteger(schemaVersion) || schemaVersion < 1) {
    return false;
  }

  if (typeof updatedAt !== "string" || parseUpdatedAt(updatedAt) === 0) {
    return false;
  }

  if (typeof isDirty !== "boolean") {
    return false;
  }

  if (
    baseRevision !== undefined &&
    (typeof baseRevision !== "number" || !Number.isInteger(baseRevision) || baseRevision < 1)
  ) {
    return false;
  }

  if (conflict !== undefined) {
    if (!isRecord(conflict)) {
      return false;
    }

    const candidate = conflict as Record<string, unknown>;

    if (
      typeof candidate.baseRevision !== "number" ||
      !Number.isInteger(candidate.baseRevision) ||
      candidate.baseRevision < 1
    ) {
      return false;
    }

    if (
      typeof candidate.serverRevision !== "number" ||
      !Number.isInteger(candidate.serverRevision) ||
      candidate.serverRevision < 1
    ) {
      return false;
    }

    if (
      !Array.isArray(candidate.changedSections) ||
      !candidate.changedSections.every((section) => typeof section === "string")
    ) {
      return false;
    }
  }

  return isRecord(value.data);
}

function parseDraftEnvelope(raw: string): DraftEnvelope | null {
  try {
    const parsed = JSON.parse(raw) as unknown;

    return isDraftEnvelope(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function listDraftKeysForScope(storage: Storage, scope: DraftScope): string[] {
  const keys: string[] = [];
  const prefix = `${DRAFT_STORAGE_PREFIX}:${scope}:`;

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (key && key.startsWith(prefix)) {
      keys.push(key);
    }
  }

  return keys.sort();
}

function enforceScopeRetention(storage: Storage, scope: DraftScope): void {
  const keys = listDraftKeysForScope(storage, scope);

  if (keys.length === 0) {
    return;
  }

  const validEntries: Array<{ key: string; envelope: DraftEnvelope }> = [];

  for (const key of keys) {
    const keyParts = parseStorageKey(key);
    const raw = storage.getItem(key);

    if (!keyParts || keyParts.scope !== scope || raw === null) {
      storage.removeItem(key);
      continue;
    }

    const envelope = parseDraftEnvelope(raw);

    if (!envelope) {
      storage.removeItem(key);
      continue;
    }

    if (
      envelope.scope !== keyParts.scope ||
      envelope.entityId !== keyParts.entityId ||
      envelope.schemaVersion !== keyParts.schemaVersion
    ) {
      storage.removeItem(key);
      continue;
    }

    validEntries.push({ key, envelope });
  }

  if (validEntries.length <= DRAFT_SCOPE_RETENTION_LIMIT) {
    return;
  }

  const entriesToEvict = validEntries
    .sort((left, right) => {
      const timeOrder = compareDraftUpdatedAt(left.envelope, right.envelope);

      if (timeOrder !== 0) {
        return timeOrder;
      }

      return left.key.localeCompare(right.key);
    })
    .slice(0, validEntries.length - DRAFT_SCOPE_RETENTION_LIMIT);

  for (const entry of entriesToEvict) {
    storage.removeItem(entry.key);
  }
}

export function createDraftStorageKey(
  scope: DraftScope,
  entityId: string,
  schemaVersion = DRAFT_SCHEMA_VERSION,
): string {
  return `${DRAFT_STORAGE_PREFIX}:${scope}:${entityId}:v${schemaVersion}`;
}

export function readPersistedDraft(
  scope: DraftScope,
  entityId: string,
  schemaVersion = DRAFT_SCHEMA_VERSION,
): DraftEnvelope | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const key = createDraftStorageKey(scope, entityId, schemaVersion);
  const raw = storage.getItem(key);

  if (raw === null) {
    return null;
  }

  const parsed = parseDraftEnvelope(raw);

  if (
    !parsed ||
    parsed.scope !== scope ||
    parsed.entityId !== entityId ||
    parsed.schemaVersion !== schemaVersion
  ) {
    storage.removeItem(key);
    return null;
  }

  return parsed;
}

export function readPersistedDraftsForScope(
  scope: DraftScope,
  schemaVersion = DRAFT_SCHEMA_VERSION,
): DraftEnvelope[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const keys = listDraftKeysForScope(storage, scope);
  const drafts: DraftEnvelope[] = [];

  for (const key of keys) {
    const keyParts = parseStorageKey(key);
    const raw = storage.getItem(key);

    if (!keyParts || keyParts.scope !== scope || raw === null) {
      storage.removeItem(key);
      continue;
    }

    const envelope = parseDraftEnvelope(raw);

    if (!envelope) {
      storage.removeItem(key);
      continue;
    }

    if (
      envelope.scope !== keyParts.scope ||
      envelope.entityId !== keyParts.entityId ||
      envelope.schemaVersion !== keyParts.schemaVersion
    ) {
      storage.removeItem(key);
      continue;
    }

    if (envelope.schemaVersion !== schemaVersion) {
      continue;
    }

    drafts.push(envelope);
  }

  return drafts.sort(compareDraftUpdatedAt);
}

export function persistDraft(envelope: DraftEnvelope): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const key = createDraftStorageKey(
    envelope.scope,
    envelope.entityId,
    envelope.schemaVersion,
  );
  const existing = readPersistedDraft(
    envelope.scope,
    envelope.entityId,
    envelope.schemaVersion,
  );

  if (existing) {
    const updatedAtOrder = compareDraftUpdatedAt(existing, envelope);

    if (updatedAtOrder >= 0) {
      return;
    }
  }

  try {
    storage.setItem(key, JSON.stringify(envelope));
    enforceScopeRetention(storage, envelope.scope);
  } catch {
    // Fail-open for UI continuity; keep in-memory draft state.
  }
}

export function removePersistedDraft(scope: DraftScope, entityId: string): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const prefix = `${DRAFT_STORAGE_PREFIX}:${scope}:${entityId}:v`;
  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    storage.removeItem(key);
  }
}
