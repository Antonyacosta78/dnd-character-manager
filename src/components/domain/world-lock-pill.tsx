import { Badge } from "@/components/ui/badge";

import { RuneIcon } from "./rune-icon";

export interface WorldLockPillProps {
  locked: boolean;
  lockedLabel: string;
  unlockedLabel: string;
  runeLabel: string;
}

export function WorldLockPill({ locked, lockedLabel, unlockedLabel, runeLabel }: WorldLockPillProps) {
  return (
    <Badge intent={locked ? "warning" : "neutral"} className="gap-1.5">
      <RuneIcon name="rune-world-lock" label={runeLabel} className="size-4 text-domain-world-lock" />
      <span>{locked ? lockedLabel : unlockedLabel}</span>
    </Badge>
  );
}
