import type { AppConfig } from "@/server/composition/app-config";
import type {
  RulesCatalog,
} from "@/server/ports/rules-catalog";

export interface RulesCatalogImplementations {
  derived: () => RulesCatalog;
  raw: () => RulesCatalog;
}

export function createRulesCatalog(
  config: Pick<AppConfig, "rulesProvider">,
  implementations: RulesCatalogImplementations,
): RulesCatalog {
  if (config.rulesProvider === "raw") {
    return implementations.raw();
  }

  return implementations.derived();
}
