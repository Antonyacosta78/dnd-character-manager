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

const workbenchAbilities: unknown = [
  { ability: "str", score: 16, modifier: 3, proficiency: "proficient" },
  { ability: "dex", score: 14, modifier: 2, proficiency: "none" },
  { ability: "con", score: 15, modifier: 2, proficiency: "proficient" },
  { ability: "int", score: 10, modifier: 0, proficiency: "none" },
  { ability: "wis", score: 12, modifier: 1, proficiency: "expertise" },
  { ability: "cha", score: 8, modifier: -1, proficiency: "none" },
];

const workbenchCombat: unknown = {
  armorClass: 17,
  initiative: 2,
  speed: "30ft",
  hitPoints: { current: 28, max: 34, temp: 4 },
};

const workbenchBranch: unknown = {
  branchName: "Ashen Vanguard",
  branchState: "stable",
  worldName: "Emberfall",
  worldLocked: true,
  snapshotFrozen: false,
  lastUpdatedLabel: "2026-04-05",
};

const invalidAbilities: unknown = [{ ability: "str", score: 0, modifier: "bad" }];

export default async function WorkbenchPage() {
  const t = await getTranslations("common");

  const routeAbilityValidation = validateAbilityScores(workbenchAbilities);
  const routeCombatValidation = validateCombatSummary(workbenchCombat);
  const routeBranchValidation = validateBranchSummary(workbenchBranch);

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
    title: t("designSystem.workbench.title"),
    subtitle: t("designSystem.workbench.subtitle"),
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
    globalSettings: {
      triggerLabel: t("designSystem.globalSettings.triggerLabel"),
      title: t("designSystem.globalSettings.title"),
      description: t("designSystem.globalSettings.description"),
      dismissLabel: t("designSystem.globalSettings.dismiss"),
      sectionsAriaLabel: t("designSystem.globalSettings.sectionsAria"),
      sectionAppearance: t("designSystem.globalSettings.sections.appearance"),
      sectionLanguage: t("designSystem.globalSettings.sections.language"),
      appearanceTitle: t("designSystem.globalSettings.appearance.title"),
      appearanceDescription: t("designSystem.globalSettings.appearance.description"),
      paletteLabel: t("designSystem.globalSettings.appearance.paletteLabel"),
      fontLabel: t("designSystem.globalSettings.appearance.fontLabel"),
      radiusLabel: t("designSystem.globalSettings.appearance.radiusLabel"),
      radiusDescription: t("designSystem.globalSettings.appearance.radiusDescription"),
      paletteOptions: {
        "2A": t("designSystem.sandbox.palette.options.2A.name"),
        "2B": t("designSystem.sandbox.palette.options.2B.name"),
        "2C": t("designSystem.sandbox.palette.options.2C.name"),
        "2D": t("designSystem.sandbox.palette.options.2D.name"),
        "2E": t("designSystem.sandbox.palette.options.2E.name"),
      },
      fontOptions: {
        baseline: t("designSystem.sandbox.switcher.fontOptions.baseline"),
        serifUi: t("designSystem.sandbox.switcher.fontOptions.serifUi"),
        bookish: t("designSystem.sandbox.switcher.fontOptions.bookish"),
        times: t("designSystem.sandbox.switcher.fontOptions.times"),
      },
      radiusOptions: {
        none: t("designSystem.globalSettings.appearance.radiusOptions.none"),
        subtle: t("designSystem.globalSettings.appearance.radiusOptions.subtle"),
        moderate: t("designSystem.globalSettings.appearance.radiusOptions.moderate"),
        pronounced: t("designSystem.globalSettings.appearance.radiusOptions.pronounced"),
      },
      languageTitle: t("designSystem.globalSettings.language.title"),
      languageDescription: t("designSystem.globalSettings.language.description"),
      languageLabel: t("designSystem.globalSettings.language.languageLabel"),
      languageOptions: {
        en: t("designSystem.globalSettings.language.options.en"),
        es: t("designSystem.globalSettings.language.options.es"),
      },
      feedbackSaving: t("designSystem.globalSettings.feedback.saving"),
      feedbackSaved: t("designSystem.globalSettings.feedback.saved"),
      feedbackFailed: t("designSystem.globalSettings.feedback.failed"),
    },
  };

  return (
    <SurfaceShell mode="workbench" activeRoute="workbench" labels={shellLabels}>
      <CombatSummaryStrip
        title={t("designSystem.sections.combat")}
        state={{ status: "ready", combat: workbenchCombat }}
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
          surfaceMode="workbench"
          title={t("designSystem.sections.abilities")}
          subtitle={t("designSystem.workbench.abilitySubtitle")}
          state={{ status: "ready", abilities: workbenchAbilities }}
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
          state={{ status: "ready", branch: workbenchBranch }}
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

      <section className="space-y-3 rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
        <h2 className="font-display text-lg text-fg-primary">{t("designSystem.sections.stateCoverage")}</h2>
        <p className="text-sm text-fg-secondary">{t("designSystem.sections.stateCoverageSubtitle")}</p>

        <div className="grid gap-3 lg:grid-cols-2">
          <CombatSummaryStrip
            title={t("designSystem.states.loading")}
            state={{ status: "loading" }}
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

          <StatGrid
            surfaceMode="workbench"
            title={t("designSystem.states.empty")}
            subtitle={t("designSystem.states.emptyMessage")}
            state={{
              status: "empty",
              title: t("designSystem.states.empty"),
              message: t("designSystem.states.emptyMessage"),
            }}
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
            title={t("designSystem.states.recoverableError")}
            state={{
              status: "error",
              title: t("designSystem.states.recoverableError"),
              message: t("designSystem.states.recoverableErrorMessage"),
              retryHref: "/workbench",
              retryLabel: t("designSystem.states.tryAgain"),
            }}
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

          <StatGrid
            surfaceMode="workbench"
            title={t("designSystem.states.validation")}
            subtitle={t("designSystem.states.validationMessage")}
            state={{ status: "ready", abilities: invalidAbilities }}
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
        </div>
      </section>
    </SurfaceShell>
  );
}
