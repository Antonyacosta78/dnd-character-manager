export type RulesProviderKind = "derived" | "raw";

export type DataIntegrityMode = "strict" | "warn" | "off";

export interface RulesRef {
  name: string;
  source: string;
}

export interface DatasetVersion {
  provider: RulesProviderKind;
  fingerprint: string;
  label?: string;
  generatedAt?: string;
}

export interface RulesFilter {
  sources?: string[];
  search?: string;
  includeLegacy?: boolean;
  includeUnearthedArcana?: boolean;
}

export interface SpellFilter extends RulesFilter {
  levels?: number[];
  schools?: string[];
  classRefs?: RulesRef[];
  ritualsOnly?: boolean;
}

export interface FeatFilter extends RulesFilter {
  categories?: string[];
  prerequisiteSearch?: string;
}

export interface RulesEntityDefinition {
  ref: RulesRef;
  sourcePage?: number;
  payload: Record<string, unknown>;
}

export interface ClassDefinition extends RulesEntityDefinition {
  hitDie?: number;
}

export interface SubclassDefinition extends RulesEntityDefinition {
  classRef: RulesRef;
}

export type RaceDefinition = RulesEntityDefinition;

export type BackgroundDefinition = RulesEntityDefinition;

export interface SpellDefinition extends RulesEntityDefinition {
  level?: number;
  school?: string;
}

export type FeatDefinition = RulesEntityDefinition;

export interface FeatureRef {
  name: string;
  source: string;
  type?: string;
  parentRef?: RulesRef;
  level?: number;
}

export interface FeatureDefinition extends RulesEntityDefinition {
  type?: string;
}

export interface RulesEntityReader<TEntity, TFilter = RulesFilter> {
  get(ref: RulesRef): Promise<TEntity | null>;
  list(filter?: TFilter): Promise<TEntity[]>;
}

export interface SubclassReader {
  get(args: {
    classRef: RulesRef;
    subclassRef: RulesRef;
  }): Promise<SubclassDefinition | null>;
  listByClass(classRef: RulesRef): Promise<SubclassDefinition[]>;
}

export interface FeatureReader {
  resolve(ref: FeatureRef): Promise<FeatureDefinition | null>;
}

/**
 * Extend this interface additively when new gameplay domains are required.
 *
 * Example when implementing feats:
 * - add `feats` namespace if not present
 * - support `rulesCatalog.feats.get(...)` and `rulesCatalog.feats.list(...)`
 */
export interface RulesCatalogNamespaces {
  classes: RulesEntityReader<ClassDefinition>;
  subclasses: SubclassReader;
  races: RulesEntityReader<RaceDefinition>;
  backgrounds: RulesEntityReader<BackgroundDefinition>;
  spells: RulesEntityReader<SpellDefinition, SpellFilter>;
  feats: RulesEntityReader<FeatDefinition, FeatFilter>;
  features: FeatureReader;
}

export interface RulesCatalog extends RulesCatalogNamespaces {
  getDatasetVersion(): Promise<DatasetVersion>;
}
