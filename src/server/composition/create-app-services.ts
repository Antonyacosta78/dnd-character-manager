import { readAppConfig, type AppConfig } from "@/server/composition/app-config";
import { createDerivedRulesCatalog } from "@/server/adapters/rules-catalog/derived-rules-catalog";
import { createRawRulesCatalog } from "@/server/adapters/rules-catalog/raw-rules-catalog";
import {
  createListOwnerCharactersUseCase,
  type ListOwnerCharactersUseCase,
} from "@/server/application/use-cases/list-owner-characters";
import {
  createCreateCharacterUseCase,
  type CreateCharacterUseCase,
} from "@/server/application/use-cases/create-character";
import {
  createSaveCharacterCanonicalUseCase,
  type SaveCharacterCanonicalUseCase,
} from "@/server/application/use-cases/save-character-canonical";
import {
  createRulesCatalog,
  type RulesCatalogImplementations,
} from "@/server/composition/rules-catalog-factory";
import type { CharacterRepository } from "@/server/ports/character-repository";
import type { CatalogImportRunRepository } from "@/server/ports/catalog-import-run-repository";
import type { CatalogVersionRepository } from "@/server/ports/catalog-version-repository";
import type { RulesCatalog } from "@/server/ports/rules-catalog";
import type { SessionContextPort } from "@/server/ports/session-context";

export interface AppServices {
  config: AppConfig;
  rulesCatalog: RulesCatalog;
  sessionContext: SessionContextPort;
  characterRepository?: CharacterRepository;
  listOwnerCharacters?: ListOwnerCharactersUseCase;
  createCharacter?: CreateCharacterUseCase;
  saveCharacterCanonical?: SaveCharacterCanonicalUseCase;
  catalogVersionRepository?: CatalogVersionRepository;
  catalogImportRunRepository?: CatalogImportRunRepository;
}

export interface CreateAppServicesOptions {
  config?: AppConfig;
  rulesCatalogImplementations?: RulesCatalogImplementations;
  sessionContextPort: SessionContextPort;
  characterRepository?: CharacterRepository;
  catalogVersionRepository?: CatalogVersionRepository;
  catalogImportRunRepository?: CatalogImportRunRepository;
}

export function createAppServices(options: CreateAppServicesOptions): AppServices {
  const config = options.config ?? readAppConfig();
  const rulesCatalog = createRulesCatalog(config, {
    derived: options.rulesCatalogImplementations?.derived ?? (() => createDerivedRulesCatalog()),
    raw: options.rulesCatalogImplementations?.raw ?? (() => createRawRulesCatalog()),
  });
  const listOwnerCharacters = options.characterRepository
    ? createListOwnerCharactersUseCase({
      sessionContext: options.sessionContextPort,
      characterRepository: options.characterRepository,
    })
    : undefined;
  const createCharacter = options.characterRepository
    ? createCreateCharacterUseCase({
      sessionContext: options.sessionContextPort,
      characterRepository: options.characterRepository,
      rulesCatalog,
    })
    : undefined;
  const saveCharacterCanonical = options.characterRepository
    ? createSaveCharacterCanonicalUseCase({
      sessionContext: options.sessionContextPort,
      characterRepository: options.characterRepository,
      rulesCatalog,
    })
    : undefined;

  return {
    config,
    rulesCatalog,
    sessionContext: options.sessionContextPort,
    characterRepository: options.characterRepository,
    listOwnerCharacters,
    createCharacter,
    saveCharacterCanonical,
    catalogVersionRepository: options.catalogVersionRepository,
    catalogImportRunRepository: options.catalogImportRunRepository,
  };
}
