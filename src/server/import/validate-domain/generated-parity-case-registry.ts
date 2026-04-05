import type { SpellGrantType } from "@/server/import/parser-types";

export type GeneratedParityCaseTier =
  | "availability_critical"
  | "lineage_critical"
  | "decorative";

export const GENERATED_PARITY_CASE_REGISTRY = {
  subclassLookup: {
    markerKeys: {
      name: "decorative",
      isReprinted: "decorative",
    },
  },
  spellSourceLookup: {
    grantTypes: {
      class: "availability_critical",
      classVariant: "availability_critical",
      subclass: "availability_critical",
      background: "availability_critical",
      charoption: "availability_critical",
      feat: "availability_critical",
      optionalfeature: "availability_critical",
      race: "availability_critical",
      reward: "availability_critical",
    },
    lineageKeys: {
      definedInSource: "lineage_critical",
      definedInSources: "lineage_critical",
    },
    markerKeys: {
      name: "decorative",
      isReprinted: "decorative",
      baseName: "decorative",
      baseSource: "decorative",
      featureType: "decorative",
      subSubclasses: "decorative",
    },
  },
} as const satisfies {
  subclassLookup: {
    markerKeys: Record<string, GeneratedParityCaseTier>;
  };
  spellSourceLookup: {
    grantTypes: Record<string, GeneratedParityCaseTier>;
    lineageKeys: Record<string, GeneratedParityCaseTier>;
    markerKeys: Record<string, GeneratedParityCaseTier>;
  };
};

const SPELL_GRANT_TYPES = new Set<SpellGrantType>(
  Object.keys(GENERATED_PARITY_CASE_REGISTRY.spellSourceLookup.grantTypes) as SpellGrantType[],
);

export function isKnownSpellGrantType(value: string): value is SpellGrantType {
  return SPELL_GRANT_TYPES.has(value as SpellGrantType);
}

export function isKnownLineageKey(value: string): boolean {
  return Object.prototype.hasOwnProperty.call(
    GENERATED_PARITY_CASE_REGISTRY.spellSourceLookup.lineageKeys,
    value,
  );
}

export function classifySpellMarkerKey(value: string): GeneratedParityCaseTier | undefined {
  if (
    Object.prototype.hasOwnProperty.call(
      GENERATED_PARITY_CASE_REGISTRY.spellSourceLookup.lineageKeys,
      value,
    )
  ) {
    return GENERATED_PARITY_CASE_REGISTRY.spellSourceLookup.lineageKeys[
      value as keyof typeof GENERATED_PARITY_CASE_REGISTRY.spellSourceLookup.lineageKeys
    ];
  }

  if (
    Object.prototype.hasOwnProperty.call(
      GENERATED_PARITY_CASE_REGISTRY.spellSourceLookup.markerKeys,
      value,
    )
  ) {
    return GENERATED_PARITY_CASE_REGISTRY.spellSourceLookup.markerKeys[
      value as keyof typeof GENERATED_PARITY_CASE_REGISTRY.spellSourceLookup.markerKeys
    ];
  }

  return undefined;
}

export function classifySubclassMarkerKey(value: string): GeneratedParityCaseTier | undefined {
  if (
    Object.prototype.hasOwnProperty.call(
      GENERATED_PARITY_CASE_REGISTRY.subclassLookup.markerKeys,
      value,
    )
  ) {
    return GENERATED_PARITY_CASE_REGISTRY.subclassLookup.markerKeys[
      value as keyof typeof GENERATED_PARITY_CASE_REGISTRY.subclassLookup.markerKeys
    ];
  }

  return undefined;
}
