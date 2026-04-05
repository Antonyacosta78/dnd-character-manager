import { Badge } from "@/components/ui/badge";

import { RuneIcon } from "./rune-icon";

export interface SnapshotSealProps {
  frozen: boolean;
  frozenLabel: string;
  activeLabel: string;
  runeLabel: string;
}

export function SnapshotSeal({ frozen, frozenLabel, activeLabel, runeLabel }: SnapshotSealProps) {
  return (
    <Badge intent={frozen ? "info" : "neutral"} className="gap-1.5">
      <RuneIcon
        name="rune-snapshot-frozen"
        label={runeLabel}
        className="size-4 text-domain-snapshot-frozen"
      />
      <span>{frozen ? frozenLabel : activeLabel}</span>
    </Badge>
  );
}
