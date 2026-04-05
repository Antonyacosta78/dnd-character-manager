import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import {
  CharacterNotFoundError,
  CharacterRequestValidationError,
  CharacterSaveConflictError,
} from "@/server/application/errors/character-core-errors";
import { validateCharacterDraftPayload } from "@/server/domain/character-core/character-core.validation";
import type {
  CharacterAggregate,
  CharacterDraftPayload,
  CharacterRepository,
} from "@/server/ports/character-repository";
import type { RulesCatalog } from "@/server/ports/rules-catalog";
import type { SessionContextPort } from "@/server/ports/session-context";

export interface SaveCharacterCanonicalInput {
  characterId: string;
  baseRevision: number;
  draft: CharacterDraftPayload;
  acknowledgedWarningCodes: string[];
}

export interface SaveCharacterCanonicalUseCaseDeps {
  sessionContext: SessionContextPort;
  characterRepository: CharacterRepository;
  rulesCatalog: RulesCatalog;
}

export interface SaveCharacterCanonicalResult {
  character: CharacterAggregate;
  warnings: Array<{ code: string; path: string; message: string }>;
}

export type SaveCharacterCanonicalUseCase = (
  input: SaveCharacterCanonicalInput,
) => Promise<SaveCharacterCanonicalResult>;

export function createSaveCharacterCanonicalUseCase({
  sessionContext,
  characterRepository,
  rulesCatalog,
}: SaveCharacterCanonicalUseCaseDeps): SaveCharacterCanonicalUseCase {
  return async function saveCharacterCanonical(input) {
    const session = await sessionContext.getSessionContext();

    if (!session.userId) {
      throw new AuthUnauthenticatedError();
    }

    const existing = await characterRepository.getByIdForOwner(input.characterId, session.userId);

    if (!existing) {
      throw new CharacterNotFoundError();
    }

    const validation = validateCharacterDraftPayload(input.draft, { mode: "save" });

    if (validation.hardIssues.length > 0) {
      throw new CharacterRequestValidationError({
        hardIssues: validation.hardIssues,
        warnings: validation.warnings,
      });
    }

    if (input.draft.level < existing.buildState.level) {
      throw new CharacterRequestValidationError({
        hardIssues: [
          {
            code: "CHARACTER_CORE_LEVEL_REGRESSION_BLOCKED",
            path: "level",
            message: "Character level cannot be lowered during canonical save.",
          },
        ],
        warnings: validation.warnings,
      });
    }

    const unacknowledgedWarningCodes = validation.warnings
      .map((warning) => warning.code)
      .filter((code) => !input.acknowledgedWarningCodes.includes(code));

    if (unacknowledgedWarningCodes.length > 0) {
      throw new CharacterRequestValidationError({
        warnings: validation.warnings,
        unacknowledgedWarningCodes,
      });
    }

    const classFromCatalog = await rulesCatalog.classes.get(input.draft.classRef);

    if (!classFromCatalog) {
      throw new CharacterRequestValidationError({
        hardIssues: [
          {
            code: "CHARACTER_CORE_CLASS_NOT_IN_CATALOG",
            path: "classRef",
            message: "Selected class was not found in the active rules catalog.",
          },
        ],
      });
    }

    if (input.draft.optionalRuleRefs && input.draft.optionalRuleRefs.length > 0) {
      for (const optionalRef of input.draft.optionalRuleRefs) {
        const feat = await rulesCatalog.feats.get(optionalRef);

        if (!feat) {
          throw new CharacterRequestValidationError({
            hardIssues: [
              {
                code: "CHARACTER_CORE_OPTIONAL_RULE_NOT_IN_CATALOG",
                path: "optionalRuleRefs",
                message: "Selected optional rule was not found in the active rules catalog.",
              },
            ],
          });
        }
      }
    }

    await rulesCatalog.getDatasetVersion();

    const saveResult = await characterRepository.saveCanonical({
      characterId: input.characterId,
      ownerUserId: session.userId,
      baseRevision: input.baseRevision,
      draft: input.draft,
      acknowledgedWarningCodes: input.acknowledgedWarningCodes,
    });

    if (saveResult.kind === "conflict") {
      throw new CharacterSaveConflictError({
        characterId: saveResult.characterId,
        baseRevision: saveResult.baseRevision,
        serverRevision: saveResult.serverRevision,
        changedSections: saveResult.changedSections,
        draft: input.draft,
      });
    }

    return {
      character: saveResult.character,
      warnings: validation.warnings,
    };
  };
}
