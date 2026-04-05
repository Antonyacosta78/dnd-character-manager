import { AbilityBlock } from "@/components/domain/ability-block";
import { SaveRow } from "@/components/domain/save-row";
import { ValidationCallout } from "@/components/domain/validation-callout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { AbilityKey, SurfaceMode } from "@/lib/design-system/tokens";
import { validateAbilityScores } from "@/lib/design-system/tokens";

type StatGridState =
  | { status: "loading" }
  | { status: "empty"; title: string; message: string }
  | { status: "error"; title: string; message: string; retryHref: string; retryLabel: string }
  | { status: "ready"; abilities: unknown };

export interface StatGridProps {
  state: StatGridState;
  surfaceMode: SurfaceMode;
  title: string;
  subtitle: string;
  validationCopy: {
    title: string;
    message: string;
    issueCountLabel: string;
    invalidRuneLabel: string;
  };
  abilityLabels: Record<AbilityKey, string>;
  saveTableLabels: {
    heading: string;
    ability: string;
    modifier: string;
    proficiency: string;
    none: string;
    proficient: string;
    expertise: string;
  };
  runeLabels: Record<AbilityKey, string>;
}

export function StatGrid({
  state,
  surfaceMode,
  title,
  subtitle,
  validationCopy,
  abilityLabels,
  saveTableLabels,
  runeLabels,
}: StatGridProps) {
  if (state.status === "loading") {
    return (
      <section className="space-y-3">
        <header>
          <h2 className="font-display text-xl text-fg-primary">{title}</h2>
          <p className="text-sm text-fg-secondary">{subtitle}</p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
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

  const validation = validateAbilityScores(state.abilities);

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

  if (validation.data.length === 0) {
    return <Alert intent="neutral" heading={title} description={subtitle} />;
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-display text-xl text-fg-primary">{title}</h2>
        <p className="text-sm text-fg-secondary">{subtitle}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {validation.data.map((ability) => (
          <AbilityBlock
            key={ability.ability}
            ability={ability}
            abilityLabel={abilityLabels[ability.ability]}
            runeLabel={runeLabels[ability.ability]}
            proficiencyLabels={{
              none: saveTableLabels.none,
              proficient: saveTableLabels.proficient,
              expertise: saveTableLabels.expertise,
            }}
            surfaceMode={surfaceMode}
          />
        ))}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-fg-secondary">
          {saveTableLabels.heading}
        </h3>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{saveTableLabels.ability}</TableHeaderCell>
              <TableHeaderCell>{saveTableLabels.modifier}</TableHeaderCell>
              <TableHeaderCell>{saveTableLabels.proficiency}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {validation.data.map((ability) => {
              const modifierLabel = ability.modifier >= 0 ? `+${ability.modifier}` : `${ability.modifier}`;
              const proficiencyLabel = ability.proficiency
                ? saveTableLabels[ability.proficiency]
                : saveTableLabels.none;

              return (
                <SaveRow
                  key={`${ability.ability}-save-row`}
                  abilityLabel={abilityLabels[ability.ability]}
                  modifierLabel={modifierLabel}
                  proficiencyLabel={proficiencyLabel}
                />
              );
            })}
            <TableRow>
              <TableCell className="text-fg-muted" colSpan={3}>
                {subtitle}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
