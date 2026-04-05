export type SurfaceMode = "workbench" | "codex";
export type DensityMode = "default" | "compact";
export type MotionMode = "system" | "reduce" | "full";

export type Intent = "neutral" | "info" | "success" | "warning" | "danger";

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type RuneName =
  | "rune-str"
  | "rune-dex"
  | "rune-con"
  | "rune-int"
  | "rune-wis"
  | "rune-cha"
  | "rune-ac"
  | "rune-hp"
  | "rune-init"
  | "rune-spell-dc"
  | "rune-branch"
  | "rune-world-lock"
  | "rune-snapshot-frozen"
  | "rune-invalid-state";

export interface AbilityScoreViewModel {
  ability: AbilityKey;
  score: number;
  modifier: number;
  proficiency?: "none" | "proficient" | "expertise";
}

export interface CombatSummaryViewModel {
  armorClass: number;
  initiative: number;
  speed: string;
  hitPoints: {
    current: number;
    max: number;
    temp?: number;
  };
  spellSaveDc?: number;
}

export interface BranchSummaryViewModel {
  branchName: string;
  branchState: "stable" | "draft" | "locked";
  worldName?: string;
  worldLocked: boolean;
  snapshotFrozen: boolean;
  lastUpdatedLabel: string;
}

export const SURFACE_CLASS_BY_MODE: Record<SurfaceMode, string> = {
  workbench: "surface-workbench",
  codex: "surface-codex",
};

export const INTENT_CLASS_BY_INTENT: Record<Intent, string> = {
  neutral: "border-border-default bg-bg-muted text-fg-secondary",
  info: "border-state-info/55 bg-state-info/12 text-state-info",
  success: "border-state-success/55 bg-state-success/12 text-state-success",
  warning: "border-state-warning/55 bg-state-warning/12 text-state-warning",
  danger: "border-state-danger/55 bg-state-danger/12 text-state-danger",
};

interface ValidationSuccess<T> {
  success: true;
  data: T;
}

interface ValidationFailure {
  success: false;
  issues: string[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null;
}

function isInteger(input: unknown): input is number {
  return typeof input === "number" && Number.isInteger(input);
}

function isAbilityKey(input: unknown): input is AbilityKey {
  return (
    input === "str" ||
    input === "dex" ||
    input === "con" ||
    input === "int" ||
    input === "wis" ||
    input === "cha"
  );
}

function isProficiency(input: unknown): input is AbilityScoreViewModel["proficiency"] {
  return input === undefined || input === "none" || input === "proficient" || input === "expertise";
}

function isBranchState(input: unknown): input is BranchSummaryViewModel["branchState"] {
  return input === "stable" || input === "draft" || input === "locked";
}

export function validateAbilityScore(input: unknown): ValidationResult<AbilityScoreViewModel> {
  if (!isRecord(input)) {
    return { success: false, issues: ["ability_score_not_object"] };
  }

  const issues: string[] = [];

  const ability = input.ability;
  const score = input.score;
  const modifier = input.modifier;
  const proficiency = input.proficiency;

  if (!isAbilityKey(ability)) {
    issues.push("ability_invalid");
  }

  if (!isInteger(score)) {
    issues.push("score_invalid");
  }

  if (isInteger(score) && score < 1) {
    issues.push("score_invalid");
  }

  if (!isInteger(modifier)) {
    issues.push("modifier_invalid");
  }

  if (!isProficiency(proficiency)) {
    issues.push("proficiency_invalid");
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      ability: ability as AbilityKey,
      score: score as number,
      modifier: modifier as number,
      proficiency: proficiency as AbilityScoreViewModel["proficiency"],
    },
  };
}

export function validateAbilityScores(input: unknown): ValidationResult<AbilityScoreViewModel[]> {
  if (!Array.isArray(input)) {
    return { success: false, issues: ["abilities_not_array"] };
  }

  const issues: string[] = [];
  const parsed: AbilityScoreViewModel[] = [];

  input.forEach((ability, index) => {
    const result = validateAbilityScore(ability);

    if (!result.success) {
      issues.push(...result.issues.map((issue) => `ability_${index}_${issue}`));
      return;
    }

    parsed.push(result.data);
  });

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return { success: true, data: parsed };
}

export function validateCombatSummary(input: unknown): ValidationResult<CombatSummaryViewModel> {
  if (!isRecord(input)) {
    return { success: false, issues: ["combat_not_object"] };
  }

  const issues: string[] = [];

  const armorClass = input.armorClass;
  const initiative = input.initiative;
  const speed = input.speed;
  const hitPoints = input.hitPoints;
  const spellSaveDc = input.spellSaveDc;

  if (!isInteger(armorClass)) {
    issues.push("armor_class_invalid");
  }

  if (isInteger(armorClass) && armorClass < 1) {
    issues.push("armor_class_invalid");
  }

  if (!isInteger(initiative)) {
    issues.push("initiative_invalid");
  }

  if (typeof speed !== "string" || speed.length === 0) {
    issues.push("speed_invalid");
  }

  if (!isRecord(hitPoints)) {
    issues.push("hit_points_invalid");
  }

  if (isRecord(hitPoints)) {
    const current = hitPoints.current;
    const max = hitPoints.max;
    const temp = hitPoints.temp;

    if (!isInteger(current)) {
      issues.push("hit_points_current_invalid");
    }

    if (isInteger(current) && current < 0) {
      issues.push("hit_points_current_invalid");
    }

    if (!isInteger(max)) {
      issues.push("hit_points_max_invalid");
    }

    if (isInteger(max) && max < 1) {
      issues.push("hit_points_max_invalid");
    }

    if (temp !== undefined && !isInteger(temp)) {
      issues.push("hit_points_temp_invalid");
    }

    if (isInteger(temp) && temp < 0) {
      issues.push("hit_points_temp_invalid");
    }
  }

  if (spellSaveDc !== undefined && !isInteger(spellSaveDc)) {
    issues.push("spell_save_dc_invalid");
  }

  if (isInteger(spellSaveDc) && spellSaveDc < 1) {
    issues.push("spell_save_dc_invalid");
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  const typedHitPoints = hitPoints as Record<string, unknown>;

  return {
    success: true,
    data: {
      armorClass: armorClass as number,
      initiative: initiative as number,
      speed: speed as string,
      hitPoints: {
        current: typedHitPoints.current as number,
        max: typedHitPoints.max as number,
        temp: typedHitPoints.temp as number | undefined,
      },
      spellSaveDc: spellSaveDc as number | undefined,
    },
  };
}

export function validateBranchSummary(input: unknown): ValidationResult<BranchSummaryViewModel> {
  if (!isRecord(input)) {
    return { success: false, issues: ["branch_not_object"] };
  }

  const issues: string[] = [];

  const branchName = input.branchName;
  const branchState = input.branchState;
  const worldName = input.worldName;
  const worldLocked = input.worldLocked;
  const snapshotFrozen = input.snapshotFrozen;
  const lastUpdatedLabel = input.lastUpdatedLabel;

  if (typeof branchName !== "string" || branchName.length === 0) {
    issues.push("branch_name_invalid");
  }

  if (!isBranchState(branchState)) {
    issues.push("branch_state_invalid");
  }

  if (worldName !== undefined && typeof worldName !== "string") {
    issues.push("world_name_invalid");
  }

  if (typeof worldLocked !== "boolean") {
    issues.push("world_locked_invalid");
  }

  if (typeof snapshotFrozen !== "boolean") {
    issues.push("snapshot_frozen_invalid");
  }

  if (typeof lastUpdatedLabel !== "string" || lastUpdatedLabel.length === 0) {
    issues.push("last_updated_invalid");
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      branchName: branchName as string,
      branchState: branchState as BranchSummaryViewModel["branchState"],
      worldName: worldName as string | undefined,
      worldLocked: worldLocked as boolean,
      snapshotFrozen: snapshotFrozen as boolean,
      lastUpdatedLabel: lastUpdatedLabel as string,
    },
  };
}
