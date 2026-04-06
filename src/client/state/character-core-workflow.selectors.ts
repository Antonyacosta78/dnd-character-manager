import type { DraftEnvelope } from "@/client/state/draft-store.types";

export type CharacterCoreSheetStep = "core" | "progression" | "inventory" | "spells" | "notes";

interface CharacterCoreIssueLike {
  code: string;
  path: string;
}

export type CharacterCoreStepBadgeStatus = "idle" | "complete" | "warning";

export interface CharacterCoreStepBadgeState {
  status: CharacterCoreStepBadgeStatus;
  hardIssueCount: number;
  warningCount: number;
}

interface SelectCharacterCoreStepBadgeStatesInput {
  stepOrder: CharacterCoreSheetStep[];
  activeStep: CharacterCoreSheetStep;
  hardIssues: CharacterCoreIssueLike[];
  warnings: CharacterCoreIssueLike[];
  acknowledgedWarningCodes: string[];
}

function resolveStepFromValidationPath(path: string): CharacterCoreSheetStep {
  if (path.startsWith("inventory")) {
    return "inventory";
  }

  if (path.startsWith("spells")) {
    return "spells";
  }

  if (path.startsWith("notes")) {
    return "notes";
  }

  if (path.startsWith("level") || path.startsWith("classRef") || path.startsWith("progression")) {
    return "progression";
  }

  return "core";
}

export function selectCharacterCoreStepBadgeStates({
  stepOrder,
  activeStep,
  hardIssues,
  warnings,
  acknowledgedWarningCodes,
}: SelectCharacterCoreStepBadgeStatesInput): Record<CharacterCoreSheetStep, CharacterCoreStepBadgeState> {
  const states: Record<CharacterCoreSheetStep, CharacterCoreStepBadgeState> = {
    core: { status: "idle", hardIssueCount: 0, warningCount: 0 },
    progression: { status: "idle", hardIssueCount: 0, warningCount: 0 },
    inventory: { status: "idle", hardIssueCount: 0, warningCount: 0 },
    spells: { status: "idle", hardIssueCount: 0, warningCount: 0 },
    notes: { status: "idle", hardIssueCount: 0, warningCount: 0 },
  };

  for (const issue of hardIssues) {
    const step = resolveStepFromValidationPath(issue.path);
    states[step].hardIssueCount += 1;
  }

  for (const warning of warnings) {
    if (acknowledgedWarningCodes.includes(warning.code)) {
      continue;
    }

    const step = resolveStepFromValidationPath(warning.path);
    states[step].warningCount += 1;
  }

  const activeIndex = stepOrder.indexOf(activeStep);

  for (const [index, step] of stepOrder.entries()) {
    const stepState = states[step];

    if (stepState.hardIssueCount > 0 || stepState.warningCount > 0) {
      stepState.status = "warning";
      continue;
    }

    if (index < activeIndex) {
      stepState.status = "complete";
      continue;
    }

    stepState.status = "idle";
  }

  return states;
}

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

  return Math.max(draft.baseRevision, fallbackRevision);
}
