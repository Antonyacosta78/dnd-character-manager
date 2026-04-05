import type { RulesCatalog } from "@/server/ports/rules-catalog";

function unsupported(): never {
  throw new Error("RULES_PROVIDER=raw is unsupported in foundation v1.");
}

export function createRawRulesCatalog(): RulesCatalog {
  return {
    getDatasetVersion: async () => unsupported(),
    classes: {
      get: async () => unsupported(),
      list: async () => unsupported(),
    },
    subclasses: {
      get: async () => unsupported(),
      listByClass: async () => unsupported(),
    },
    races: {
      get: async () => unsupported(),
      list: async () => unsupported(),
    },
    backgrounds: {
      get: async () => unsupported(),
      list: async () => unsupported(),
    },
    spells: {
      get: async () => unsupported(),
      list: async () => unsupported(),
    },
    feats: {
      get: async () => unsupported(),
      list: async () => unsupported(),
    },
    features: {
      resolve: async () => unsupported(),
    },
  };
}
