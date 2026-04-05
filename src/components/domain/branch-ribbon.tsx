import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

import { RuneIcon } from "./rune-icon";

export interface BranchRibbonProps {
  branchName: string;
  branchState: "stable" | "draft" | "locked";
  branchLabel: string;
  stateLabel: string;
  runeLabel: string;
}

const ribbonIntent: Record<BranchRibbonProps["branchState"], "success" | "warning" | "danger"> = {
  stable: "success",
  draft: "warning",
  locked: "danger",
};

export function BranchRibbon({
  branchName,
  branchState,
  branchLabel,
  stateLabel,
  runeLabel,
}: BranchRibbonProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-radius-sm border border-border-default bg-bg-surface px-3 py-2 shadow-shadow-soft">
      <div className="flex items-center gap-2">
        <RuneIcon name="rune-branch" label={runeLabel} className="text-domain-branch" />
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.08em] text-fg-muted">{branchLabel}</p>
          <p className={cn("font-medium text-fg-primary", "break-words")}>{branchName}</p>
        </div>
      </div>
      <Badge intent={ribbonIntent[branchState]}>{stateLabel}</Badge>
    </div>
  );
}
