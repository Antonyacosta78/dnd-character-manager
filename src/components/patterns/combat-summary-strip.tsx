import { CombatBadge } from "@/components/domain/combat-badge";
import { ValidationCallout } from "@/components/domain/validation-callout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { validateCombatSummary } from "@/lib/design-system/tokens";

type CombatSummaryState =
  | { status: "loading" }
  | { status: "empty"; title: string; message: string }
  | { status: "error"; title: string; message: string; retryHref: string; retryLabel: string }
  | { status: "ready"; combat: unknown };

export interface CombatSummaryStripProps {
  state: CombatSummaryState;
  title: string;
  validationCopy: {
    title: string;
    message: string;
    issueCountLabel: string;
    invalidRuneLabel: string;
  };
  labels: {
    armorClass: string;
    initiative: string;
    hitPoints: string;
    speed: string;
    spellSaveDc: string;
    unavailable: string;
  };
  runeLabels: {
    armorClass: string;
    initiative: string;
    hitPoints: string;
    speed: string;
    spellSaveDc: string;
  };
}

export function CombatSummaryStrip({ state, title, validationCopy, labels, runeLabels }: CombatSummaryStripProps) {
  if (state.status === "loading") {
    return (
      <section className="space-y-3">
        <h2 className="font-display text-lg text-fg-primary">{title}</h2>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
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

  const validation = validateCombatSummary(state.combat);

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

  const hpLabel = `${validation.data.hitPoints.current}/${validation.data.hitPoints.max}`;
  const initLabel = validation.data.initiative >= 0 ? `+${validation.data.initiative}` : `${validation.data.initiative}`;
  const spellDcLabel =
    validation.data.spellSaveDc === undefined ? labels.unavailable : `${validation.data.spellSaveDc}`;

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg text-fg-primary">{title}</h2>
      <div className="sticky top-2 z-10 grid gap-2 rounded-radius-sm border border-border-default bg-bg-canvas/92 p-2 shadow-shadow-soft backdrop-blur-[2px] motion-reduce:backdrop-blur-none sm:grid-cols-3 lg:grid-cols-5">
        <CombatBadge
          label={labels.armorClass}
          value={`${validation.data.armorClass}`}
          rune="rune-ac"
          runeLabel={runeLabels.armorClass}
        />
        <CombatBadge
          label={labels.initiative}
          value={initLabel}
          rune="rune-init"
          runeLabel={runeLabels.initiative}
        />
        <CombatBadge
          label={labels.hitPoints}
          value={hpLabel}
          rune="rune-hp"
          runeLabel={runeLabels.hitPoints}
        />
        <CombatBadge
          label={labels.speed}
          value={validation.data.speed}
          rune="rune-init"
          runeLabel={runeLabels.speed}
          tone="support"
        />
        <CombatBadge
          label={labels.spellSaveDc}
          value={spellDcLabel}
          rune="rune-spell-dc"
          runeLabel={runeLabels.spellSaveDc}
          tone="support"
        />
      </div>
    </section>
  );
}
