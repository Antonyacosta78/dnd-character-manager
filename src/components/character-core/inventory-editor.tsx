"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CharacterInventoryEntry } from "@/server/ports/character-repository";

interface InventoryEditorCopy {
  title: string;
  addRow: string;
  labelPlaceholder: string;
  quantityLabel: string;
  remove: string;
}

interface InventoryEditorProps {
  copy: InventoryEditorCopy;
  entries: CharacterInventoryEntry[];
  onChange: (entries: CharacterInventoryEntry[]) => void;
}

export function InventoryEditor({ copy, entries, onChange }: InventoryEditorProps) {
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
                id: `inv-${crypto.randomUUID()}`,
                label: "",
                quantity: 1,
                carriedState: "carried",
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
          <div key={entry.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
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
            <Input
              type="number"
              min={1}
              value={entry.quantity}
              aria-label={copy.quantityLabel}
              onChange={(event) => {
                onChange(entries.map((candidate) =>
                  candidate.id === entry.id
                    ? { ...candidate, quantity: Math.max(1, Number(event.target.value) || 1) }
                    : candidate));
              }}
              className="sm:w-24"
            />
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
