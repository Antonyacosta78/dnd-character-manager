"use client";

import { Button } from "@/components/ui/button";

interface ConflictResolutionCopy {
  title: string;
  description: string;
  keepLocal: string;
  keepServer: string;
  reviewDifferences: string;
  changedSectionsLabel: string;
}

interface ConflictResolutionDialogProps {
  copy: ConflictResolutionCopy;
  open: boolean;
  changedSections: string[];
  onKeepLocal: () => void;
  onKeepServer: () => void;
  onReviewDifferences: () => void;
}

export function ConflictResolutionDialog({
  copy,
  open,
  changedSections,
  onKeepLocal,
  onKeepServer,
  onReviewDifferences,
}: ConflictResolutionDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/45 p-4">
      <section
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg space-y-4 rounded-radius-sm border border-border-strong bg-bg-elevated p-4 shadow-shadow-panel"
      >
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-fg-primary">{copy.title}</h2>
          <p className="text-sm text-fg-secondary">{copy.description}</p>
        </div>

        <div className="rounded-radius-sm border border-border-default bg-bg-muted p-2 text-xs text-fg-secondary">
          <p className="font-semibold text-fg-primary">{copy.changedSectionsLabel}</p>
          <p>{changedSections.join(", ")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button density="compact" intent="primary" autoFocus onClick={onReviewDifferences}>
            {copy.reviewDifferences}
          </Button>
          <Button density="compact" intent="neutral" onClick={onKeepLocal}>
            {copy.keepLocal}
          </Button>
          <Button density="compact" intent="danger" onClick={onKeepServer}>
            {copy.keepServer}
          </Button>
        </div>
      </section>
    </div>
  );
}
