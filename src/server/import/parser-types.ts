import type { ImportIssueDetails, ImportIssueSeverity, ImportStage } from "@/server/import/types";

export type ParserStage = Extract<
  ImportStage,
  "validate_source" | "resolve" | "normalize" | "validate_domain"
>;

export interface ParserDiagnostic {
  stage: ParserStage;
  severity: ImportIssueSeverity;
  code: string;
  message: string;
  filePath?: string;
  details?: ImportIssueDetails;
}

export interface DataSourceFile {
  relativePath: string;
  absolutePath: string;
}

export interface CanonicalDataSourceFiles {
  classIndex: DataSourceFile;
  classFiles: DataSourceFile[];
  spellIndex: DataSourceFile;
  spellFiles: DataSourceFile[];
  spellSources: DataSourceFile;
  races: DataSourceFile;
  backgrounds: DataSourceFile;
  feats: DataSourceFile;
  optionalfeatures: DataSourceFile;
  optionalCharcreationoptions?: DataSourceFile;
  optionalRewards?: DataSourceFile;
  generatedSubclassLookup?: DataSourceFile;
  generatedSpellSourceLookup?: DataSourceFile;
}

export interface ValidatedDataSource {
  dataRootPath: string;
  files: CanonicalDataSourceFiles;
  documents: Map<string, unknown>;
}

export type SourceEntityKind =
  | "class"
  | "subclass"
  | "subrace"
  | "classFeature"
  | "subclassFeature"
  | "spell"
  | "race"
  | "background"
  | "feat"
  | "optionalfeature"
  | "charoption"
  | "reward";

export interface SourceEntity {
  kind: SourceEntityKind;
  filePath: string;
  value: Record<string, unknown>;
}

export interface ResolvedFeatureReference {
  ownerKind: "class" | "subclass";
  ownerName: string;
  ownerSource: string;
  ownerClassName?: string;
  ownerClassSource?: string;
  featureKind: "classFeature" | "subclassFeature";
  featureUid: string;
  featureName?: string;
  featureSource?: string;
  flags?: Record<string, unknown>;
}

export type SpellGrantType =
  | "class"
  | "classVariant"
  | "subclass"
  | "background"
  | "charoption"
  | "feat"
  | "optionalfeature"
  | "race"
  | "reward";

export type SpellAdditionType = "innate" | "known" | "prepared" | "expanded";

export interface ResolvedSpellSourceEdge {
  spellName: string;
  spellSource: string;
  grantType: SpellGrantType;
  ownerName: string;
  ownerSource: string;
  ownerClassName?: string;
  ownerClassSource?: string;
  ownerSubclassShortName?: string;
  additionType?: SpellAdditionType;
  definedInSource?: string;
  definedInSources?: string[];
  provenanceFilePath: string;
}

export interface ResolveAdditionalSpellsFailure {
  ownerKind: SpellGrantType;
  ownerName: string;
  ownerSource: string;
  reason: string;
  filePath: string;
}

export interface ResolveUnresolvedReference {
  referenceKind: "copy" | "classFeature" | "subclassFeature" | "spell";
  reference: string;
  ownerKind: SourceEntityKind;
  ownerName: string;
  ownerSource: string;
  filePath: string;
}

export interface ResolvedDataSource {
  entities: SourceEntity[];
  featureReferences: ResolvedFeatureReference[];
  spellSourceEdges: ResolvedSpellSourceEdge[];
  unresolvedReferences: ResolveUnresolvedReference[];
  unsupportedAdditionalSpells: ResolveAdditionalSpellsFailure[];
  diagnostics: ParserDiagnostic[];
  generatedSubclassLookup?: unknown;
  generatedSpellSourceLookup?: unknown;
}

export interface NormalizedEntity {
  kind: SourceEntityKind;
  identity: string;
  name: string;
  source: string;
  payload: Record<string, unknown>;
  edition?: string;
  reprintedAs?: unknown;
  otherSources?: unknown;
}

export interface NormalizedDataSource {
  entities: NormalizedEntity[];
  spellSourceEdges: ResolvedSpellSourceEdge[];
  featureReferences: ResolvedFeatureReference[];
  unresolvedReferences: ResolveUnresolvedReference[];
  unsupportedAdditionalSpells: ResolveAdditionalSpellsFailure[];
  generatedSubclassLookup?: unknown;
  generatedSpellSourceLookup?: unknown;
  diagnostics: ParserDiagnostic[];
}

export interface ValidateDomainResult {
  diagnostics: ParserDiagnostic[];
}
