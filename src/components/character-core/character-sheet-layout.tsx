"use client";

import { useEffect, useMemo, useState } from "react";

import {
  selectCharacterCoreBaseRevision,
  selectCharacterCoreConflictState,
  selectCharacterCoreSaveDisabled,
} from "@/client/state/character-core-workflow.selectors";
import { useDraftStore } from "@/client/state/draft-store";
import { ConflictResolutionDialog } from "@/components/character-core/conflict-resolution-dialog";
import { InventoryEditor } from "@/components/character-core/inventory-editor";
import { LevelUpPanel } from "@/components/character-core/level-up-panel";
import { PdfExportActions } from "@/components/character-core/pdf-export-actions";
import { ShareToggleCard } from "@/components/character-core/share-toggle-card";
import { SpellsEditor } from "@/components/character-core/spells-editor";
import { ValidationSummary } from "@/components/character-core/validation-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CHARACTER_WARNING_CONCEPT_SHORT,
  validateCharacterDraftPayload,
} from "@/server/domain/character-core/character-core.validation";
import type { CharacterAggregate, CharacterInventoryEntry, CharacterSpellEntry } from "@/server/ports/character-repository";

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

export function CharacterSheetLayout({ character, copy }: CharacterSheetLayoutProps) {
  const [activeTab, setActiveTab] = useState<SheetTab>("core");
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(character.name);
  const [concept, setConcept] = useState(character.buildState.concept);
  const [notes, setNotes] = useState(character.buildState.notes ?? "");
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
        classRef: character.buildState.classRef,
        level: character.buildState.level,
        notes,
        inventory,
        spells,
        optionalRuleRefs: character.buildState.optionalRuleRefs,
      }),
    [character.buildState.classRef, character.buildState.level, character.buildState.optionalRuleRefs, concept, inventory, name, notes, spells],
  );
  const unacknowledgedWarnings = validation.warnings.filter((warning) => !acknowledgedWarningCodes.includes(warning.code));
  const saveDisabled = selectCharacterCoreSaveDisabled(draftEnvelope, validation.hardIssues.length > 0, unacknowledgedWarnings.length > 0);
  const conflict = selectCharacterCoreConflictState(draftEnvelope);
  const baseRevision = selectCharacterCoreBaseRevision(draftEnvelope, revision);

  const saveDraft = async (overrideBaseRevision?: number) => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          baseRevision: overrideBaseRevision ?? baseRevision,
          draft: {
            name,
            concept,
            classRef: character.buildState.classRef,
            level: character.buildState.level,
            notes,
            inventory,
            spells,
            optionalRuleRefs: character.buildState.optionalRuleRefs,
          },
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
      <section className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-2 rounded-radius-sm border border-border-default bg-bg-surface p-3 shadow-shadow-soft">
        <div>
          <h1 className="text-lg font-semibold text-fg-primary">{name}</h1>
          <p className="text-xs text-fg-secondary">
            {character.buildState.classRef.name} · {character.buildState.level}
          </p>
        </div>
        <p className="text-xs text-fg-secondary" aria-live="polite">
          {draftEnvelope?.isDirty ? copy.dirty : copy.saved}
        </p>
      </section>

      <Tabs
        items={tabs}
        activeValue={activeTab}
        ariaLabel={copy.tabsAria}
        className="overflow-x-auto"
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            density="compact"
            intent={activeTab === tab.value ? "primary" : "neutral"}
            aria-label={tab.label}
            onClick={() => setActiveTab(tab.value as SheetTab)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

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
          currentClassRef={character.buildState.classRef}
          onFinalized={(nextRevision, level) => {
            setRevision(nextRevision);
            markSaved(DRAFT_SCOPE, character.id, "save");
            setBaseRevision(DRAFT_SCOPE, character.id, nextRevision, "save");
            clearConflict(DRAFT_SCOPE, character.id, "save");
            if (level > character.buildState.level) {
              patchDraft(DRAFT_SCOPE, character.id, { level }, "save");
            }
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
            void saveDraft();
          }}
        />
      </div>

      <div className="sticky bottom-2 z-10 rounded-radius-sm border border-border-default bg-bg-surface/95 p-2 backdrop-blur-sm motion-reduce:backdrop-blur-none">
        <Button
          intent="primary"
          className="w-full"
          disabled={isSaving || saveDisabled}
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
