import { BranchRibbon } from "@/components/domain/branch-ribbon";
import { SnapshotSeal } from "@/components/domain/snapshot-seal";
import { ValidationCallout } from "@/components/domain/validation-callout";
import { WorldLockPill } from "@/components/domain/world-lock-pill";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { validateBranchSummary } from "@/lib/design-system/tokens";

type BranchSummaryState =
  | { status: "loading" }
  | { status: "empty"; title: string; message: string }
  | { status: "error"; title: string; message: string; retryHref: string; retryLabel: string }
  | { status: "ready"; branch: unknown };

export interface BranchSummaryPanelProps {
  state: BranchSummaryState;
  title: string;
  validationCopy: {
    title: string;
    message: string;
    issueCountLabel: string;
    invalidRuneLabel: string;
  };
  labels: {
    branchLabel: string;
    stateStable: string;
    stateDraft: string;
    stateLocked: string;
    worldLocked: string;
    worldUnlocked: string;
    snapshotFrozen: string;
    snapshotActive: string;
    updated: string;
    unavailable: string;
  };
  runeLabels: {
    branch: string;
    worldLock: string;
    snapshotFrozen: string;
  };
}

export function BranchSummaryPanel({
  state,
  title,
  validationCopy,
  labels,
  runeLabels,
}: BranchSummaryPanelProps) {
  if (state.status === "loading") {
    return (
      <section className="rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
        <h2 className="font-display text-lg text-fg-primary">{title}</h2>
        <p className="mt-3 h-4 w-2/3 rounded-radius-xs bg-bg-muted" />
        <p className="mt-2 h-4 w-1/2 rounded-radius-xs bg-bg-muted" />
      </section>
    );
  }

  if (state.status === "empty") {
    return <Alert intent="neutral" heading={state.title} description={state.message} />;
  }

  if (state.status === "error") {
    return (
      <Alert intent="warning" heading={state.title} description={state.message}>
        <Button as="a" href={state.retryHref} intent="neutral" density="compact">
          {state.retryLabel}
        </Button>
      </Alert>
    );
  }

  const validation = validateBranchSummary(state.branch);

  if (!validation.success) {
    return (
      <ValidationCallout
        intent="danger"
        title={validationCopy.title}
        message={validationCopy.message}
        invalidRuneLabel={validationCopy.invalidRuneLabel}
        details={[`${validationCopy.issueCountLabel}: ${validation.issues.length}`]}
      />
    );
  }

  const stateLabel =
    validation.data.branchState === "stable"
      ? labels.stateStable
      : validation.data.branchState === "draft"
        ? labels.stateDraft
        : labels.stateLocked;

  return (
    <section className="rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
      <h2 className="font-display text-lg text-fg-primary">{title}</h2>
      <div className="mt-3 space-y-3">
        <BranchRibbon
          branchName={validation.data.branchName}
          branchState={validation.data.branchState}
          branchLabel={labels.branchLabel}
          stateLabel={stateLabel}
          runeLabel={runeLabels.branch}
        />
        <div className="flex flex-wrap items-center gap-2">
          <WorldLockPill
            locked={validation.data.worldLocked}
            lockedLabel={labels.worldLocked}
            unlockedLabel={labels.worldUnlocked}
            runeLabel={runeLabels.worldLock}
          />
          <SnapshotSeal
            frozen={validation.data.snapshotFrozen}
            frozenLabel={labels.snapshotFrozen}
            activeLabel={labels.snapshotActive}
            runeLabel={runeLabels.snapshotFrozen}
          />
        </div>
        <p className="text-sm text-fg-secondary">
          {labels.updated}: <span className="text-fg-primary">{validation.data.lastUpdatedLabel}</span>
        </p>
        <p className="text-sm text-fg-secondary">
          {validation.data.worldName ? validation.data.worldName : labels.unavailable}
        </p>
      </div>
    </section>
  );
}
