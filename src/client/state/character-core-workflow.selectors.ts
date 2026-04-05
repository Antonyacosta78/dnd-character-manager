import type { DraftEnvelope } from "@/client/state/draft-store.types";

export function selectCharacterCoreSaveDisabled(
  draft: DraftEnvelope | null,
  hasHardIssues: boolean,
  hasUnacknowledgedWarnings: boolean,
): boolean {
  if (!draft) {
    return true;
  }

  if (!draft.isDirty) {
    return true;
  }

  return hasHardIssues || hasUnacknowledgedWarnings;
}

export function selectCharacterCoreConflictState(draft: DraftEnvelope | null) {
  return draft?.conflict ?? null;
}

export function selectCharacterCoreBaseRevision(draft: DraftEnvelope | null, fallbackRevision: number): number {
  if (!draft?.baseRevision || draft.baseRevision < 1) {
    return fallbackRevision;
  }

  return draft.baseRevision;
}
