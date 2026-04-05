import { getTranslations } from "next-intl/server";

import { ValidationCallout } from "@/components/domain/validation-callout";
import { BranchSummaryPanel } from "@/components/patterns/branch-summary-panel";
import { CombatSummaryStrip } from "@/components/patterns/combat-summary-strip";
import { StatGrid } from "@/components/patterns/stat-grid";
import { SurfaceShell } from "@/components/patterns/surface-shell";
import {
  validateAbilityScores,
  validateBranchSummary,
  validateCombatSummary,
} from "@/lib/design-system/tokens";

const codexAbilities: unknown = [
  { ability: "str", score: 11, modifier: 0, proficiency: "none" },
  { ability: "dex", score: 18, modifier: 4, proficiency: "expertise" },
  { ability: "con", score: 13, modifier: 1, proficiency: "proficient" },
  { ability: "int", score: 16, modifier: 3, proficiency: "proficient" },
  { ability: "wis", score: 12, modifier: 1, proficiency: "none" },
  { ability: "cha", score: 15, modifier: 2, proficiency: "none" },
];

const codexCombat: unknown = {
  armorClass: 15,
  initiative: 4,
  speed: "35ft",
  hitPoints: { current: 22, max: 22 },
  spellSaveDc: 14,
};

const codexBranch: unknown = {
  branchName: "Whispered Library",
  branchState: "draft",
  worldName: "Violet Archive",
  worldLocked: false,
  snapshotFrozen: true,
  lastUpdatedLabel: "2026-04-04",
};

export default async function CodexPage() {
  const t = await getTranslations("common");

  const routeAbilityValidation = validateAbilityScores(codexAbilities);
  const routeCombatValidation = validateCombatSummary(codexCombat);
  const routeBranchValidation = validateBranchSummary(codexBranch);

  if (!routeAbilityValidation.success || !routeCombatValidation.success || !routeBranchValidation.success) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <ValidationCallout
          intent="danger"
          title={t("designSystem.validation.routeBoundaryTitle")}
          message={t("designSystem.validation.routeBoundaryMessage")}
          invalidRuneLabel={t("designSystem.runes.invalid")}
          details={[t("designSystem.validation.routeBoundaryHint")]}
        />
      </main>
    );
  }

  const shellLabels = {
    navAriaLabel: t("designSystem.nav.aria"),
    title: t("designSystem.codex.title"),
    subtitle: t("designSystem.codex.subtitle"),
    appName: t("appName"),
    workbench: t("designSystem.surface.workbench"),
    codex: t("designSystem.surface.codex"),
    quickAction: t("designSystem.shell.quickAction"),
    drawerTrigger: t("designSystem.shell.drawerTrigger"),
    drawerTitle: t("designSystem.shell.drawerTitle"),
    drawerDescription: t("designSystem.shell.drawerDescription"),
    drawerDismiss: t("designSystem.shell.dismiss"),
    dialogTrigger: t("designSystem.shell.dialogTrigger"),
    dialogTitle: t("designSystem.shell.dialogTitle"),
    dialogDescription: t("designSystem.shell.dialogDescription"),
    dialogDismiss: t("designSystem.shell.dismiss"),
    drawerInputLabel: t("designSystem.shell.drawerInputLabel"),
    drawerInputPlaceholder: t("designSystem.shell.drawerInputPlaceholder"),
    drawerTextareaLabel: t("designSystem.shell.drawerTextareaLabel"),
    drawerTextareaPlaceholder: t("designSystem.shell.drawerTextareaPlaceholder"),
  };

  return (
    <SurfaceShell mode="codex" activeRoute="codex" labels={shellLabels}>
      <section className="rounded-radius-sm border border-border-default bg-bg-surface px-4 py-3 shadow-shadow-soft codex-ornament">
        <p className="font-body text-sm leading-6 text-fg-secondary">{t("designSystem.codex.editorialIntro")}</p>
      </section>

      <CombatSummaryStrip
        title={t("designSystem.sections.combat")}
        state={{ status: "ready", combat: codexCombat }}
        validationCopy={{
          title: t("designSystem.validation.patternTitle"),
          message: t("designSystem.validation.patternMessage"),
          issueCountLabel: t("designSystem.validation.issueCount"),
          invalidRuneLabel: t("designSystem.runes.invalid"),
        }}
        labels={{
          armorClass: t("designSystem.combat.armorClass"),
          initiative: t("designSystem.combat.initiative"),
          hitPoints: t("designSystem.combat.hitPoints"),
          speed: t("designSystem.combat.speed"),
          spellSaveDc: t("designSystem.combat.spellSaveDc"),
          unavailable: t("designSystem.combat.unavailable"),
        }}
        runeLabels={{
          armorClass: t("designSystem.runes.armorClass"),
          initiative: t("designSystem.runes.initiative"),
          hitPoints: t("designSystem.runes.hitPoints"),
          speed: t("designSystem.runes.speed"),
          spellSaveDc: t("designSystem.runes.spellSaveDc"),
        }}
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <StatGrid
          surfaceMode="codex"
          title={t("designSystem.sections.abilities")}
          subtitle={t("designSystem.codex.abilitySubtitle")}
          state={{ status: "ready", abilities: codexAbilities }}
          validationCopy={{
            title: t("designSystem.validation.patternTitle"),
            message: t("designSystem.validation.patternMessage"),
            issueCountLabel: t("designSystem.validation.issueCount"),
            invalidRuneLabel: t("designSystem.runes.invalid"),
          }}
          abilityLabels={{
            str: t("designSystem.ability.str"),
            dex: t("designSystem.ability.dex"),
            con: t("designSystem.ability.con"),
            int: t("designSystem.ability.int"),
            wis: t("designSystem.ability.wis"),
            cha: t("designSystem.ability.cha"),
          }}
          saveTableLabels={{
            heading: t("designSystem.saves.heading"),
            ability: t("designSystem.saves.ability"),
            modifier: t("designSystem.saves.modifier"),
            proficiency: t("designSystem.saves.proficiency"),
            none: t("designSystem.proficiency.none"),
            proficient: t("designSystem.proficiency.proficient"),
            expertise: t("designSystem.proficiency.expertise"),
          }}
          runeLabels={{
            str: t("designSystem.runes.str"),
            dex: t("designSystem.runes.dex"),
            con: t("designSystem.runes.con"),
            int: t("designSystem.runes.int"),
            wis: t("designSystem.runes.wis"),
            cha: t("designSystem.runes.cha"),
          }}
        />

        <BranchSummaryPanel
          title={t("designSystem.sections.branch")}
          state={{ status: "ready", branch: codexBranch }}
          validationCopy={{
            title: t("designSystem.validation.patternTitle"),
            message: t("designSystem.validation.patternMessage"),
            issueCountLabel: t("designSystem.validation.issueCount"),
            invalidRuneLabel: t("designSystem.runes.invalid"),
          }}
          labels={{
            branchLabel: t("designSystem.branch.branch"),
            stateStable: t("designSystem.branch.stateStable"),
            stateDraft: t("designSystem.branch.stateDraft"),
            stateLocked: t("designSystem.branch.stateLocked"),
            worldLocked: t("designSystem.branch.worldLocked"),
            worldUnlocked: t("designSystem.branch.worldUnlocked"),
            snapshotFrozen: t("designSystem.branch.snapshotFrozen"),
            snapshotActive: t("designSystem.branch.snapshotActive"),
            updated: t("designSystem.branch.updated"),
            unavailable: t("designSystem.branch.unavailable"),
          }}
          runeLabels={{
            branch: t("designSystem.runes.branch"),
            worldLock: t("designSystem.runes.worldLock"),
            snapshotFrozen: t("designSystem.runes.snapshotFrozen"),
          }}
        />
      </section>
    </SurfaceShell>
  );
}
