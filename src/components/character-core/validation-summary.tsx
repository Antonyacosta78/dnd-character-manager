"use client";

import type { CharacterValidationIssue } from "@/server/domain/character-core/character-core.types";

interface ValidationSummaryCopy {
  title: string;
  hardTitle: string;
  warningTitle: string;
  acknowledgeLabel: string;
}

interface ValidationSummaryProps {
  copy: ValidationSummaryCopy;
  hardIssues: CharacterValidationIssue[];
  warnings: CharacterValidationIssue[];
  acknowledgedWarningCodes: string[];
  onAcknowledgeWarning: (warningCode: string, acknowledged: boolean) => void;
}

export function ValidationSummary({
  copy,
  hardIssues,
  warnings,
  acknowledgedWarningCodes,
  onAcknowledgeWarning,
}: ValidationSummaryProps) {
  if (hardIssues.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-radius-sm border border-border-default bg-bg-elevated p-3" aria-live="polite">
      <h2 className="text-sm font-semibold text-fg-primary">{copy.title}</h2>

      {hardIssues.length > 0 ? (
        <div className="space-y-2 rounded-radius-sm border border-state-danger/40 bg-state-danger/10 p-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-state-danger">{copy.hardTitle}</p>
          <ul className="space-y-1 text-sm text-fg-primary">
            {hardIssues.map((issue) => (
              <li key={`${issue.code}:${issue.path}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="space-y-2 rounded-radius-sm border border-accent-brass/40 bg-accent-brass/10 p-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-primary">{copy.warningTitle}</p>
          <ul className="space-y-2 text-sm text-fg-primary">
            {warnings.map((warning) => {
              const isAcknowledged = acknowledgedWarningCodes.includes(warning.code);

              return (
                <li key={`${warning.code}:${warning.path}`} className="space-y-1">
                  <p>{warning.message}</p>
                  <label className="flex items-start gap-2 text-xs text-fg-secondary">
                    <input
                      type="checkbox"
                      checked={isAcknowledged}
                      onChange={(event) => onAcknowledgeWarning(warning.code, event.target.checked)}
                    />
                    <span>{copy.acknowledgeLabel}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
