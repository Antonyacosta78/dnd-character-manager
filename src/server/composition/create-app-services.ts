import { readAppConfig, type AppConfig } from "@/server/composition/app-config";
import { createDerivedRulesCatalog } from "@/server/adapters/rules-catalog/derived-rules-catalog";
import { createRawRulesCatalog } from "@/server/adapters/rules-catalog/raw-rules-catalog";
import {
  createRulesCatalog,
  type RulesCatalogImplementations,
} from "@/server/composition/rules-catalog-factory";
import type { CatalogImportRunRepository } from "@/server/ports/catalog-import-run-repository";
import type { CatalogVersionRepository } from "@/server/ports/catalog-version-repository";
import type { RulesCatalog } from "@/server/ports/rules-catalog";
import type { SessionContextPort } from "@/server/ports/session-context";

export interface AppServices {
  config: AppConfig;
  rulesCatalog: RulesCatalog;
  sessionContext: SessionContextPort;
  catalogVersionRepository?: CatalogVersionRepository;
  catalogImportRunRepository?: CatalogImportRunRepository;
}

export interface CreateAppServicesOptions {
  config?: AppConfig;
  rulesCatalogImplementations?: RulesCatalogImplementations;
  sessionContextPort: SessionContextPort;
  catalogVersionRepository?: CatalogVersionRepository;
  catalogImportRunRepository?: CatalogImportRunRepository;
}

export function createAppServices(options: CreateAppServicesOptions): AppServices {
  const config = options.config ?? readAppConfig();
  const rulesCatalog = createRulesCatalog(config, {
    derived: options.rulesCatalogImplementations?.derived ?? (() => createDerivedRulesCatalog()),
    raw: options.rulesCatalogImplementations?.raw ?? (() => createRawRulesCatalog()),
  });

  return {
    config,
    rulesCatalog,
    sessionContext: options.sessionContextPort,
    catalogVersionRepository: options.catalogVersionRepository,
    catalogImportRunRepository: options.catalogImportRunRepository,
  };
}
