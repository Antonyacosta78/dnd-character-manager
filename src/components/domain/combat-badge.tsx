import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { RuneName } from "@/lib/design-system/tokens";

import { RuneIcon } from "./rune-icon";

type CombatTone = "core" | "support";

export interface CombatBadgeProps {
  label: string;
  value: string;
  rune: RuneName;
  runeLabel: string;
  tone?: CombatTone;
}

export function CombatBadge({
  label,
  value,
  rune,
  runeLabel,
  tone = "core",
}: CombatBadgeProps) {
  return (
    <div
      className={cn(
        "flex min-w-28 items-center gap-2 rounded-radius-sm border border-border-default bg-bg-surface px-3 py-2 shadow-shadow-soft",
        tone === "core" ? "text-domain-stat-combat" : "text-fg-secondary",
      )}
    >
      <RuneIcon name={rune} label={runeLabel} className="text-current" />
      <div>
        <p className="text-[0.65rem] uppercase tracking-[0.08em] text-fg-muted">{label}</p>
        <p className="font-ui text-lg font-semibold leading-tight text-current">{value}</p>
      </div>
      <Badge intent="neutral" className="ml-auto">
        {label}
      </Badge>
    </div>
  );
}
