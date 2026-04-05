import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AbilityBlock } from "@/components/domain/ability-block";
import { BranchRibbon } from "@/components/domain/branch-ribbon";
import { CombatBadge } from "@/components/domain/combat-badge";
import { SaveRow } from "@/components/domain/save-row";
import { SnapshotSeal } from "@/components/domain/snapshot-seal";
import { ValidationCallout } from "@/components/domain/validation-callout";
import { WorldLockPill } from "@/components/domain/world-lock-pill";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { SandboxThemeShell } from "./sandbox-theme-shell";

export default async function UiSandboxPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const t = await getTranslations("common");

  return (
    <main>
      <SandboxThemeShell
        labels={{
          title: t("designSystem.sandbox.switcher.title"),
          description: t("designSystem.sandbox.switcher.description"),
          paletteLabel: t("designSystem.sandbox.switcher.paletteLabel"),
          fontLabel: t("designSystem.sandbox.switcher.fontLabel"),
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
        }}
      >
        <header className="rounded-radius-sm border border-border-strong bg-bg-surface p-4 shadow-shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.08em] text-fg-muted">{t("appName")}</p>
              <h1 className="font-display text-2xl text-fg-primary">{t("designSystem.sandbox.title")}</h1>
              <p className="text-sm text-fg-secondary">{t("designSystem.sandbox.description")}</p>
            </div>
            <Badge intent="warning">{t("designSystem.sandbox.devOnly")}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button as="a" href="/" intent="neutral" density="compact">
              {t("appName")}
            </Button>
            <Button as="a" href="/workbench" intent="primary" density="compact">
              {t("designSystem.surface.workbench")}
            </Button>
            <Button as="a" href="/codex" intent="neutral" density="compact">
              {t("designSystem.surface.codex")}
            </Button>
          </div>
        </header>

        <section className="space-y-3 rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
          <h2 className="font-display text-lg text-fg-primary">{t("designSystem.sandbox.primitives")}</h2>

          <div className="flex flex-wrap gap-2">
            <Button intent="primary">{t("designSystem.shell.quickAction")}</Button>
            <Button intent="neutral">{t("designSystem.states.tryAgain")}</Button>
            <Button intent="danger">{t("designSystem.states.recoverableError")}</Button>
            <Button intent="ghost">{t("designSystem.surface.codex")}</Button>
            <Button intent="primary" density="compact">
              {t("designSystem.surface.workbench")}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.08em] text-fg-secondary">
              {t("designSystem.shell.drawerInputLabel")}
              <Input placeholder={t("designSystem.shell.drawerInputPlaceholder")} />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.08em] text-fg-secondary">
              {t("designSystem.shell.drawerInputLabel")}
              <Input hasError placeholder={t("designSystem.validation.patternMessage")} />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.08em] text-fg-secondary">
              {t("designSystem.sections.combat")}
              <Select defaultValue="combat">
                <option value="combat">{t("designSystem.sections.combat")}</option>
                <option value="abilities">{t("designSystem.sections.abilities")}</option>
                <option value="branch">{t("designSystem.sections.branch")}</option>
              </Select>
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.08em] text-fg-secondary">
              {t("designSystem.shell.drawerTextareaLabel")}
              <Textarea placeholder={t("designSystem.shell.drawerTextareaPlaceholder")} />
            </label>
          </div>

          <Tabs
            ariaLabel={t("designSystem.nav.aria")}
            activeValue="workbench"
            items={[
              { value: "workbench", label: t("designSystem.surface.workbench") },
              { value: "codex", label: t("designSystem.surface.codex") },
              { value: "branch", label: t("designSystem.sections.branch") },
            ]}
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Alert
              intent="info"
              heading={t("designSystem.states.loading")}
              description={t("designSystem.states.emptyMessage")}
            />
            <Alert
              intent="warning"
              heading={t("designSystem.states.validation")}
              description={t("designSystem.states.validationMessage")}
            />
            <Alert
              intent="danger"
              heading={t("designSystem.states.recoverableError")}
              description={t("designSystem.states.recoverableErrorMessage")}
            />
            <div className="space-y-2 rounded-radius-sm border border-border-default bg-bg-elevated p-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge intent="neutral">neutral</Badge>
            <Badge intent="info">info</Badge>
            <Badge intent="success">success</Badge>
            <Badge intent="warning">warning</Badge>
            <Badge intent="danger">danger</Badge>
          </div>

          <div className="flex flex-wrap items-start gap-3">
            <Drawer
              triggerLabel={t("designSystem.shell.drawerTrigger")}
              title={t("designSystem.shell.drawerTitle")}
              description={t("designSystem.shell.drawerDescription")}
              dismissLabel={t("designSystem.shell.dismiss")}
            >
              <Input placeholder={t("designSystem.shell.drawerInputPlaceholder")} />
              <Textarea className="mt-2" placeholder={t("designSystem.shell.drawerTextareaPlaceholder")} />
            </Drawer>

            <Dialog
              triggerLabel={t("designSystem.shell.dialogTrigger")}
              title={t("designSystem.shell.dialogTitle")}
              description={t("designSystem.shell.dialogDescription")}
              dismissLabel={t("designSystem.shell.dismiss")}
            >
              <p className="text-sm text-fg-secondary">{t("designSystem.codex.editorialIntro")}</p>
            </Dialog>
          </div>
        </section>

        <section className="space-y-3 rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
          <h2 className="font-display text-lg text-fg-primary">{t("designSystem.sandbox.domain")}</h2>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <AbilityBlock
              ability={{ ability: "str", score: 18, modifier: 4, proficiency: "proficient" }}
              abilityLabel={t("designSystem.ability.str")}
              runeLabel={t("designSystem.runes.str")}
              proficiencyLabels={{
                none: t("designSystem.proficiency.none"),
                proficient: t("designSystem.proficiency.proficient"),
                expertise: t("designSystem.proficiency.expertise"),
              }}
              surfaceMode="workbench"
            />

            <CombatBadge
              label={t("designSystem.combat.armorClass")}
              value="19"
              rune="rune-ac"
              runeLabel={t("designSystem.runes.armorClass")}
              tone="core"
            />

            <BranchRibbon
              branchName="Ashen Vanguard"
              branchState="stable"
              branchLabel={t("designSystem.branch.branch")}
              stateLabel={t("designSystem.branch.stateStable")}
              runeLabel={t("designSystem.runes.branch")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <WorldLockPill
              locked
              lockedLabel={t("designSystem.branch.worldLocked")}
              unlockedLabel={t("designSystem.branch.worldUnlocked")}
              runeLabel={t("designSystem.runes.worldLock")}
            />
            <SnapshotSeal
              frozen
              frozenLabel={t("designSystem.branch.snapshotFrozen")}
              activeLabel={t("designSystem.branch.snapshotActive")}
              runeLabel={t("designSystem.runes.snapshotFrozen")}
            />
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("designSystem.saves.ability")}</TableHeaderCell>
                <TableHeaderCell>{t("designSystem.saves.modifier")}</TableHeaderCell>
                <TableHeaderCell>{t("designSystem.saves.proficiency")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <SaveRow
                abilityLabel={t("designSystem.ability.dex")}
                modifierLabel="+4"
                proficiencyLabel={t("designSystem.proficiency.expertise")}
              />
              <SaveRow
                abilityLabel={t("designSystem.ability.wis")}
                modifierLabel="+1"
                proficiencyLabel={t("designSystem.proficiency.proficient")}
              />
            </TableBody>
          </Table>

          <ValidationCallout
            intent="danger"
            title={t("designSystem.validation.patternTitle")}
            message={t("designSystem.validation.patternMessage")}
            invalidRuneLabel={t("designSystem.runes.invalid")}
            details={[t("designSystem.validation.routeBoundaryHint")]}
          />
        </section>

        <section className="rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
          <h2 className="font-display text-lg text-fg-primary">{t("designSystem.sandbox.patterns")}</h2>
          <p className="mt-1 text-sm text-fg-secondary">{t("designSystem.sandbox.patternsDescription")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button as="a" href="/workbench" intent="primary" density="compact">
              {t("designSystem.surface.workbench")}
            </Button>
            <Button as="a" href="/codex" intent="neutral" density="compact">
              {t("designSystem.surface.codex")}
            </Button>
          </div>
        </section>
      </SandboxThemeShell>
    </main>
  );
}
