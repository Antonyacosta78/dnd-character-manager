import {
  AuthUnauthenticatedError,
} from "@/server/application/errors/auth-errors";
import { CharacterRequestValidationError } from "@/server/application/errors/character-core-errors";
import { validateCharacterDraftPayload } from "@/server/domain/character-core/character-core.validation";
import type { CharacterAggregate, CharacterDraftPayload, CharacterRepository } from "@/server/ports/character-repository";
import type { RulesCatalog } from "@/server/ports/rules-catalog";
import type { SessionContextPort } from "@/server/ports/session-context";

export interface CreateCharacterInput {
  draft: CharacterDraftPayload;
  acknowledgedWarningCodes: string[];
}

export interface CreateCharacterUseCaseDeps {
  sessionContext: SessionContextPort;
  characterRepository: CharacterRepository;
  rulesCatalog: RulesCatalog;
}

export type CreateCharacterUseCase = (input: CreateCharacterInput) => Promise<CharacterAggregate>;

export function createCreateCharacterUseCase({
  sessionContext,
  characterRepository,
  rulesCatalog,
}: CreateCharacterUseCaseDeps): CreateCharacterUseCase {
  return async function createCharacter(input) {
    const session = await sessionContext.getSessionContext();

    if (!session.userId) {
      throw new AuthUnauthenticatedError();
    }

    const validation = validateCharacterDraftPayload(input.draft, { mode: "create" });

    if (validation.hardIssues.length > 0) {
      throw new CharacterRequestValidationError({
        hardIssues: validation.hardIssues,
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

    return characterRepository.createCharacter({
      ownerUserId: session.userId,
      draft: input.draft,
      acknowledgedWarningCodes: input.acknowledgedWarningCodes,
    });
  };
}
