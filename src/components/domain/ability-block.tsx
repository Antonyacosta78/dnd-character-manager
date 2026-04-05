import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { AbilityKey, AbilityScoreViewModel, SurfaceMode } from "@/lib/design-system/tokens";

import { RuneIcon } from "./rune-icon";

const runeByAbility: Record<AbilityKey, "rune-str" | "rune-dex" | "rune-con" | "rune-int" | "rune-wis" | "rune-cha"> = {
  str: "rune-str",
  dex: "rune-dex",
  con: "rune-con",
  int: "rune-int",
  wis: "rune-wis",
  cha: "rune-cha",
};

export interface AbilityBlockProps {
  ability: AbilityScoreViewModel;
  abilityLabel: string;
  runeLabel: string;
  proficiencyLabels: {
    none: string;
    proficient: string;
    expertise: string;
  };
  surfaceMode: SurfaceMode;
}

export function AbilityBlock({
  ability,
  abilityLabel,
  runeLabel,
  proficiencyLabels,
  surfaceMode,
}: AbilityBlockProps) {
  const modifierLabel = ability.modifier >= 0 ? `+${ability.modifier}` : `${ability.modifier}`;

  return (
    <article
      className={cn(
        "rounded-radius-sm border border-border-default bg-bg-surface p-3 shadow-shadow-soft",
        surfaceMode === "codex" ? "codex-ornament" : undefined,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <RuneIcon name={runeByAbility[ability.ability]} label={runeLabel} className="text-domain-stat-core" />
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.08em] text-fg-muted">{abilityLabel}</p>
            <p className="font-ui text-2xl font-semibold text-domain-stat-core">{ability.score}</p>
          </div>
        </div>

        <Badge intent="info" className="self-start">
          {ability.proficiency ? proficiencyLabels[ability.proficiency] : proficiencyLabels.none}
        </Badge>
      </header>

      <p className="mt-3 text-sm text-fg-secondary">
        <span className="font-semibold text-fg-primary">{modifierLabel}</span>
      </p>
    </article>
  );
}
