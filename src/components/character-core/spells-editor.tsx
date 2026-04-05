"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CharacterSpellEntry } from "@/server/ports/character-repository";

interface SpellsEditorCopy {
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
}

interface SpellsEditorProps {
  copy: SpellsEditorCopy;
  entries: CharacterSpellEntry[];
  onChange: (entries: CharacterSpellEntry[]) => void;
}

export function SpellsEditor({ copy, entries, onChange }: SpellsEditorProps) {
  return (
    <section className="space-y-3 rounded-radius-sm border border-border-default bg-bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg-primary">{copy.title}</h3>
        <Button
          density="compact"
          onClick={() => {
            onChange([
              ...entries,
              {
                id: `spell-${crypto.randomUUID()}`,
                label: "",
                status: "known",
                isCustom: true,
              },
            ]);
          }}
        >
          {copy.addRow}
        </Button>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_12rem_auto]">
            <Input
              value={entry.label}
              placeholder={copy.labelPlaceholder}
              onChange={(event) => {
                onChange(entries.map((candidate) =>
                  candidate.id === entry.id
                    ? { ...candidate, label: event.target.value }
                    : candidate));
              }}
            />
            <Select
              value={entry.status}
              aria-label={copy.statusLabel}
              onChange={(event) => {
                const status = event.target.value === "prepared"
                  ? "prepared"
                  : event.target.value === "always"
                    ? "always"
                    : "known";

                onChange(entries.map((candidate) =>
                  candidate.id === entry.id
                    ? { ...candidate, status }
                    : candidate));
              }}
            >
              <option value="known">{copy.statuses.known}</option>
              <option value="prepared">{copy.statuses.prepared}</option>
              <option value="always">{copy.statuses.always}</option>
            </Select>
            <Button
              density="compact"
              intent="ghost"
              onClick={() => onChange(entries.filter((candidate) => candidate.id !== entry.id))}
            >
              {copy.remove}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
