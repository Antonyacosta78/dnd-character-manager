export interface CharacterValidationIssue {
  code: string;
  path: string;
  message: string;
  catalogContext?: {
    name: string;
    source: string;
  };
}

export type CharacterValidationWarning = CharacterValidationIssue;
export type CharacterValidationHardIssue = CharacterValidationIssue;

export interface CharacterValidationResult {
  hardIssues: CharacterValidationHardIssue[];
  warnings: CharacterValidationWarning[];
}

export interface CharacterLevelPlan {
  targetLevel: number;
  classRef: {
    name: string;
    source: string;
  };
  autoApplied: Array<{
    code: string;
    description: string;
  }>;
  requiredChoices: Array<{
    path: string;
    code: string;
    message: string;
  }>;
  requiresMulticlassConfirmation: boolean;
}
