import type {
  CharacterChangedSection,
  CharacterDraftPayload,
} from "@/server/ports/character-repository";
import type {
  CharacterValidationHardIssue,
  CharacterValidationWarning,
} from "@/server/domain/character-core/character-core.types";

export class CharacterRequestValidationError extends Error {
  readonly code = "REQUEST_VALIDATION_FAILED" as const;

  constructor(
    readonly details: {
      hardIssues?: CharacterValidationHardIssue[];
      warnings?: CharacterValidationWarning[];
      unacknowledgedWarningCodes?: string[];
    },
    message = "Request validation failed.",
  ) {
    super(message);
    this.name = "CharacterRequestValidationError";
  }
}

export class CharacterNotFoundError extends Error {
  readonly code = "CHARACTER_NOT_FOUND" as const;

  constructor(message = "Character was not found.") {
    super(message);
    this.name = "CharacterNotFoundError";
  }
}

export class CharacterSaveConflictError extends Error {
  readonly code = "CHARACTER_SAVE_CONFLICT" as const;

  constructor(
    readonly details: {
      characterId: string;
      baseRevision: number;
      serverRevision: number;
      changedSections: CharacterChangedSection[];
      draft: CharacterDraftPayload;
    },
    message = "Character has a newer server revision.",
  ) {
    super(message);
    this.name = "CharacterSaveConflictError";
  }
}
