import type {
  RulesCatalog,
  RulesProviderKind,
} from "@/server/ports/rules-catalog";

export interface CreateRulesCatalogOptions {
  provider: RulesProviderKind;
}

export interface RulesCatalogImplementations {
  derived: () => RulesCatalog;
  raw: () => RulesCatalog;
}

export function createRulesCatalog(
  options: CreateRulesCatalogOptions,
  implementations: RulesCatalogImplementations,
): RulesCatalog {
  if (options.provider === "raw") {
    return implementations.raw();
  }

  return implementations.derived();
}
