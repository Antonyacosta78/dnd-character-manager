"use client";

import { useEffect, useMemo, useState } from "react";

import {
  selectCharacterCoreBaseRevision,
  selectCharacterCoreConflictState,
  selectCharacterCoreSaveDisabled,
  selectCharacterCoreStepBadgeStates,
  type CharacterCoreSheetStep,
} from "@/client/state/character-core-workflow.selectors";
import { useDraftStore } from "@/client/state/draft-store";
import { CharacterWorkbenchShell } from "@/components/character-core/character-workbench-shell";
import { ConflictResolutionDialog } from "@/components/character-core/conflict-resolution-dialog";
import { InventoryEditor } from "@/components/character-core/inventory-editor";
import { LevelUpPanel } from "@/components/character-core/level-up-panel";
import { PdfExportActions } from "@/components/character-core/pdf-export-actions";
import { ShareToggleCard } from "@/components/character-core/share-toggle-card";
import { SpellsEditor } from "@/components/character-core/spells-editor";
import { ValidationSummary } from "@/components/character-core/validation-summary";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CHARACTER_WARNING_CONCEPT_SHORT,
  validateCharacterDraftPayload,
} from "@/server/domain/character-core/character-core.validation";
import type {
  CharacterAggregate,
  CharacterCatalogRef,
  CharacterDraftPayload,
  CharacterInventoryEntry,
  CharacterSpellEntry,
} from "@/server/ports/character-repository";
import type { LevelUpFinalizedPayload } from "@/components/character-core/level-up-panel";

interface CharacterSheetLayoutCopy {
  tabsAria: string;
  tabs: {
    core: string;
    progression: string;
    inventory: string;
    spells: string;
    notes: string;
  };
  save: string;
  saving: string;
  dirty: string;
  saved: string;
  nameLabel: string;
  classLabel: string;
  levelLabel: string;
  revisionLabel: string;
  conceptLabel: string;
  notesLabel: string;
  validation: {
    title: string;
    hardTitle: string;
    warningTitle: string;
    acknowledgeLabel: string;
  };
  inventory: {
    title: string;
    addRow: string;
    labelPlaceholder: string;
    quantityLabel: string;
    remove: string;
  };
  spells: {
    title: string;
    addRow: string;
    labelPlaceholder: string;
    statusLabel: string;
    remove: string;
    statuses: {
      known: string;
      prepared: string;
      always: string;
    };
  };
  level: {
    title: string;
    plan: string;
    finalize: string;
    planning: string;
    finalizing: string;
    multiclassConfirm: string;
    targetLevelLabel: string;
  };
  share: {
    title: string;
    description: string;
    enable: string;
    disable: string;
    enabled: string;
    disabled: string;
  };
  export: {
    title: string;
    summary: string;
    official: string;
    saveThenExport: string;
    exportLastSaved: string;
  };
  utilities: {
    trigger: string;
    title: string;
    description: string;
    dismiss: string;
  };
  conflict: {
    title: string;
    description: string;
    keepLocal: string;
    keepServer: string;
    reviewDifferences: string;
    changedSectionsLabel: string;
  };
}

interface CharacterSheetLayoutProps {
  character: CharacterAggregate;
  copy: CharacterSheetLayoutCopy;
}

const DRAFT_SCOPE = "character-sheet" as const;

type SheetTab = "core" | "progression" | "inventory" | "spells" | "notes";

const SHEET_STEP_ORDER: CharacterCoreSheetStep[] = ["core", "progression", "inventory", "spells", "notes"];

interface CharacterSheetProgressionState {
  classRef: CharacterCatalogRef;
  level: number;
}

interface CreateCharacterSheetSaveDraftInput {
  name: string;
  concept: string;
  notes: string;
  inventory: CharacterInventoryEntry[];
  spells: CharacterSpellEntry[];
  optionalRuleRefs: CharacterDraftPayload["optionalRuleRefs"];
  progression: CharacterSheetProgressionState;
}

export function createCharacterSheetSaveDraft({
  name,
  concept,
  notes,
  inventory,
  spells,
  optionalRuleRefs,
  progression,
}: CreateCharacterSheetSaveDraftInput): CharacterDraftPayload {
  return {
    name,
    concept,
    classRef: progression.classRef,
    level: progression.level,
    notes,
    inventory,
    spells,
    optionalRuleRefs,
  };
}

export function CharacterSheetLayout({ character, copy }: CharacterSheetLayoutProps) {
  const [activeTab, setActiveTab] = useState<SheetTab>("core");
  const [isSaving, setIsSaving] = useState(false);
  const [isProgressionBusy, setIsProgressionBusy] = useState(false);
  const [name, setName] = useState(character.name);
  const [concept, setConcept] = useState(character.buildState.concept);
  const [notes, setNotes] = useState(character.buildState.notes ?? "");
  const [buildClassRef, setBuildClassRef] = useState(character.buildState.classRef);
  const [buildLevel, setBuildLevel] = useState(character.buildState.level);
  const [revision, setRevision] = useState(character.revision);
  const [inventory, setInventory] = useState<CharacterInventoryEntry[]>(character.inventory ?? []);
  const [spells, setSpells] = useState<CharacterSpellEntry[]>(character.spells ?? []);
  const [shareEnabled, setShareEnabled] = useState(character.shareSettings?.shareEnabled ?? false);
  const [shareToken, setShareToken] = useState(character.shareSettings?.shareToken ?? null);
  const [acknowledgedWarningCodes, setAcknowledgedWarningCodes] = useState<string[]>(
    character.warningOverrides.map((warning) => warning.code),
  );
  const [showConflictDiff, setShowConflictDiff] = useState(false);

  const loadDraft = useDraftStore((state) => state.loadDraft);
  const patchDraft = useDraftStore((state) => state.patchDraft);
  const markSaved = useDraftStore((state) => state.markSaved);
  const setBaseRevision = useDraftStore((state) => state.setBaseRevision);
  const markConflict = useDraftStore((state) => state.markConflict);
  const clearConflict = useDraftStore((state) => state.clearConflict);
  const draftEnvelope = useDraftStore((state) => state.byScope[DRAFT_SCOPE][character.id] ?? null);

  useEffect(() => {
    const existing = loadDraft<{
      name?: string;
      concept?: string;
      notes?: string;
      inventory?: CharacterInventoryEntry[];
      spells?: CharacterSpellEntry[];
      acknowledgedWarningCodes?: string[];
    }>(DRAFT_SCOPE, character.id);

    if (!existing) {
      return;
    }

    if (typeof existing.data.name === "string") {
      setName(existing.data.name);
    }

    if (typeof existing.data.concept === "string") {
      setConcept(existing.data.concept);
    }

    if (typeof existing.data.notes === "string") {
      setNotes(existing.data.notes);
    }

    if (Array.isArray(existing.data.inventory)) {
      setInventory(existing.data.inventory);
    }

    if (Array.isArray(existing.data.spells)) {
      setSpells(existing.data.spells);
    }

    if (Array.isArray(existing.data.acknowledgedWarningCodes)) {
      setAcknowledgedWarningCodes(existing.data.acknowledgedWarningCodes.filter((code) => typeof code === "string"));
    }
  }, [character.id, loadDraft]);

  useEffect(() => {
    patchDraft(
      DRAFT_SCOPE,
      character.id,
      {
        name,
        concept,
        notes,
        inventory,
        spells,
        acknowledgedWarningCodes,
      },
      "blur",
    );
  }, [acknowledgedWarningCodes, character.id, concept, inventory, name, notes, patchDraft, spells]);

  const validation = useMemo(
    () =>
      validateCharacterDraftPayload({
        name,
        concept,
        classRef: buildClassRef,
        level: buildLevel,
        notes,
        inventory,
        spells,
        optionalRuleRefs: character.buildState.optionalRuleRefs,
      }),
    [buildClassRef, buildLevel, character.buildState.optionalRuleRefs, concept, inventory, name, notes, spells],
  );
  const unacknowledgedWarnings = validation.warnings.filter((warning) => !acknowledgedWarningCodes.includes(warning.code));
  const saveDisabled = selectCharacterCoreSaveDisabled(draftEnvelope, validation.hardIssues.length > 0, unacknowledgedWarnings.length > 0);
  const conflict = selectCharacterCoreConflictState(draftEnvelope);
  const baseRevision = selectCharacterCoreBaseRevision(draftEnvelope, revision);
  const stepBadgeStates = selectCharacterCoreStepBadgeStates({
    stepOrder: SHEET_STEP_ORDER,
    activeStep: activeTab,
    hardIssues: validation.hardIssues,
    warnings: validation.warnings,
    acknowledgedWarningCodes,
  });

  const saveDraft = async (overrideBaseRevision?: number) => {
    if (isProgressionBusy) {
      return false;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          baseRevision: overrideBaseRevision ?? baseRevision,
          draft: createCharacterSheetSaveDraft({
            name,
            concept,
            notes,
            inventory,
            spells,
            optionalRuleRefs: character.buildState.optionalRuleRefs,
            progression: {
              classRef: buildClassRef,
              level: buildLevel,
            },
          }),
          acknowledgedWarningCodes,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: {
            details?: {
              conflict?: {
                baseRevision: number;
                serverRevision: number;
                changedSections: string[];
              };
            };
          };
        };

        const conflictDetails = payload.error?.details?.conflict;

        if (conflictDetails) {
          markConflict(DRAFT_SCOPE, character.id, {
            baseRevision: conflictDetails.baseRevision,
            serverRevision: conflictDetails.serverRevision,
            changedSections: conflictDetails.changedSections,
          }, "save");
        }

        return false;
      }

      const payload = (await response.json()) as {
        data: {
          character: {
            revision: number;
          };
        };
      };
      const nextRevision = payload.data.character.revision;

      setRevision(nextRevision);
      clearConflict(DRAFT_SCOPE, character.id, "save");
      markSaved(DRAFT_SCOPE, character.id, "save");
      setBaseRevision(DRAFT_SCOPE, character.id, nextRevision, "save");

      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { value: "core", label: copy.tabs.core },
    { value: "progression", label: copy.tabs.progression },
    { value: "inventory", label: copy.tabs.inventory },
    { value: "spells", label: copy.tabs.spells },
    { value: "notes", label: copy.tabs.notes },
  ];

  return (
    <div className="space-y-4">
      <CharacterWorkbenchShell
        header={(
          <>
            <h1 className="text-lg font-semibold text-fg-primary">{name}</h1>
            <p className="text-xs text-fg-secondary">
              {buildClassRef.name} · {buildLevel}
            </p>
          </>
        )}
        saveState={<>{draftEnvelope?.isDirty ? copy.dirty : copy.saved}</>}
        actions={(
          <Dialog
            triggerLabel={copy.utilities.trigger}
            title={copy.utilities.title}
            description={copy.utilities.description}
            dismissLabel={copy.utilities.dismiss}
          >
            <div className="grid gap-3 lg:grid-cols-2">
              <ShareToggleCard
                copy={copy.share}
                characterId={character.id}
                enabled={shareEnabled}
                shareToken={shareToken}
                onChange={(payload) => {
                  setShareEnabled(payload.enabled);
                  setShareToken(payload.shareToken);
                }}
              />
              <PdfExportActions
                copy={copy.export}
                characterId={character.id}
                hasUnsavedChanges={Boolean(draftEnvelope?.isDirty)}
                onRequestSaveBeforeExport={() => {
                  if (isProgressionBusy) {
                    return;
                  }

                  void saveDraft();
                }}
              />
            </div>
          </Dialog>
        )}
        steps={tabs.map((tab) => ({
          id: tab.value,
          label: tab.label,
          status: stepBadgeStates[tab.value as SheetTab].status,
          isActive: activeTab === tab.value,
          onSelect: () => {
            if (isProgressionBusy) {
              return;
            }

            setActiveTab(tab.value as SheetTab);
          },
        }))}
        pulse={(
          <div className="space-y-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-secondary">{copy.tabs.progression}</p>
            <ul className="space-y-1 text-fg-primary">
              <li>
                {copy.classLabel}: {buildClassRef.name}
              </li>
              <li>
                {copy.levelLabel}: {buildLevel}
              </li>
              <li>
                {copy.revisionLabel}: {revision}
              </li>
            </ul>
            <p className="text-xs text-fg-secondary" aria-live="polite">
              {draftEnvelope?.isDirty ? copy.dirty : copy.saved}
            </p>
            {conflict ? (
              <p className="rounded-radius-sm border border-state-danger/40 bg-state-danger/10 px-2 py-1 text-xs text-state-danger">
                {copy.conflict.title}
              </p>
            ) : null}
          </div>
        )}
        canvas={(
          <>
            {activeTab === "core" ? (
              <section className="space-y-3 rounded-radius-sm border border-border-default bg-bg-surface p-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-fg-primary" htmlFor="character-sheet-name">
                    {copy.nameLabel}
                  </label>
                  <Input id="character-sheet-name" value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-fg-primary" htmlFor="character-sheet-concept">
                    {copy.conceptLabel}
                  </label>
                  <Textarea id="character-sheet-concept" value={concept} onChange={(event) => setConcept(event.target.value)} />
                </div>
              </section>
            ) : null}

            {activeTab === "progression" ? (
              <LevelUpPanel
                copy={copy.level}
                characterId={character.id}
                baseRevision={baseRevision}
                currentClassRef={buildClassRef}
                onBusyStateChange={setIsProgressionBusy}
                onFinalized={(payload: LevelUpFinalizedPayload) => {
                  setRevision(payload.revision);
                  setBuildLevel(payload.level);
                  setBuildClassRef(payload.classRef);
                  markSaved(DRAFT_SCOPE, character.id, "save");
                  setBaseRevision(DRAFT_SCOPE, character.id, payload.revision, "save");
                  clearConflict(DRAFT_SCOPE, character.id, "save");
                  patchDraft(DRAFT_SCOPE, character.id, { level: payload.level, classRef: payload.classRef }, "save");
                }}
              />
            ) : null}

            {activeTab === "inventory" ? (
              <InventoryEditor copy={copy.inventory} entries={inventory} onChange={setInventory} />
            ) : null}

            {activeTab === "spells" ? (
              <SpellsEditor copy={copy.spells} entries={spells} onChange={setSpells} />
            ) : null}

            {activeTab === "notes" ? (
              <section className="space-y-2 rounded-radius-sm border border-border-default bg-bg-surface p-3">
                <label className="text-sm font-medium text-fg-primary" htmlFor="character-sheet-notes">
                  {copy.notesLabel}
                </label>
                <Textarea id="character-sheet-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </section>
            ) : null}

            <ValidationSummary
              copy={copy.validation}
              hardIssues={validation.hardIssues}
              warnings={validation.warnings}
              acknowledgedWarningCodes={acknowledgedWarningCodes}
              onAcknowledgeWarning={(warningCode, acknowledged) => {
                setAcknowledgedWarningCodes((previous) => {
                  if (acknowledged) {
                    return previous.includes(warningCode) ? previous : [...previous, warningCode];
                  }

                  return previous.filter((code) => code !== warningCode);
                });
              }}
            />
          </>
        )}
      />

      <div className="sticky bottom-2 z-10 rounded-radius-sm border border-border-default bg-bg-surface/95 p-2 backdrop-blur-sm motion-reduce:backdrop-blur-none">
        <Button
          intent="primary"
          className="w-full"
          disabled={isSaving || saveDisabled || isProgressionBusy}
          onClick={() => {
            void saveDraft();
          }}
        >
          {isSaving ? copy.saving : copy.save}
        </Button>
      </div>

      <ConflictResolutionDialog
        copy={copy.conflict}
        open={Boolean(conflict)}
        changedSections={showConflictDiff && conflict ? conflict.changedSections : conflict?.changedSections ?? []}
        onReviewDifferences={() => {
          setShowConflictDiff(true);
        }}
        onKeepLocal={() => {
          if (!conflict) {
            return;
          }

          setShowConflictDiff(false);
          void saveDraft(conflict.serverRevision);
        }}
        onKeepServer={() => {
          setShowConflictDiff(false);

          void (async () => {
            const response = await fetch(`/api/characters/${character.id}`, {
              method: "GET",
            });

            if (!response.ok) {
              return;
            }

            const payload = (await response.json()) as {
              data: {
                character: CharacterAggregate;
              };
            };
            const serverCharacter = payload.data.character;

            setName(serverCharacter.name);
            setConcept(serverCharacter.buildState.concept);
            setNotes(serverCharacter.buildState.notes ?? "");
            setInventory(serverCharacter.inventory ?? []);
            setSpells(serverCharacter.spells ?? []);
            setBuildLevel(serverCharacter.buildState.level);
            setBuildClassRef(serverCharacter.buildState.classRef);
            setRevision(serverCharacter.revision);
            clearConflict(DRAFT_SCOPE, character.id, "save");
            markSaved(DRAFT_SCOPE, character.id, "save");
            setBaseRevision(DRAFT_SCOPE, character.id, serverCharacter.revision, "save");
            setAcknowledgedWarningCodes(serverCharacter.warningOverrides.map((warning) => warning.code));
          })();
        }}
      />
    </div>
  );
}

export const CHARACTER_CORE_WARNING_CODES = {
  conceptShort: CHARACTER_WARNING_CONCEPT_SHORT,
} as const;
