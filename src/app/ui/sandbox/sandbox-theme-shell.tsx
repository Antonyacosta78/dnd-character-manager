"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";

import { Select } from "@/components/ui/select";

type PaletteCode = "2A" | "2B" | "2C" | "2D" | "2E";
type FontCode = "baseline" | "serifUi" | "bookish" | "times";

type CssVars = CSSProperties & Record<`--${string}`, string>;

interface SandboxThemeShellLabels {
  title: string;
  description: string;
  paletteLabel: string;
  fontLabel: string;
  paletteOptions: Record<PaletteCode, string>;
  fontOptions: Record<FontCode, string>;
}

interface SandboxThemeShellProps {
  labels: SandboxThemeShellLabels;
  children: ReactNode;
}

const SHARED_STATE_VARS: CssVars = {
  "--state-info": "#375974",
  "--state-success": "#2f6b3a",
  "--state-warning": "#896322",
  "--state-danger": "#8f2d2d",
  "--state-danger-strong": "#6d1f1f",
};

const PALETTE_VARS_BY_CODE: Record<PaletteCode, CssVars> = {
  "2A": {
    "--bg-canvas": "#f3ebd8",
    "--bg-surface": "#e9dfc8",
    "--bg-elevated": "#f8f1e2",
    "--bg-muted": "#dfd1b1",
    "--fg-primary": "#2c241d",
    "--fg-secondary": "#4a3d32",
    "--fg-muted": "#705f4f",
    "--border-default": "#b89e7a",
    "--border-strong": "#8e7554",
    "--accent-rubric": "#7a1f1f",
    "--accent-rubric-strong": "#631919",
    "--accent-brass": "#a4752b",
    "--accent-arcane": "#5b4f7f",
    "--domain-stat-core": "#7a1f1f",
    "--domain-stat-combat": "#593a13",
    "--domain-branch": "#4e3f8a",
    "--domain-world-lock": "#7a4f1a",
    "--domain-snapshot-frozen": "#3f5d71",
    "--ink": "#1d1712",
    "--parchment": "#f8f1e2",
    ...SHARED_STATE_VARS,
  },
  "2B": {
    "--bg-canvas": "#ece8dd",
    "--bg-surface": "#e2dccd",
    "--bg-elevated": "#f5f2ea",
    "--bg-muted": "#d6cebc",
    "--fg-primary": "#25272b",
    "--fg-secondary": "#3f434b",
    "--fg-muted": "#606670",
    "--border-default": "#b0a792",
    "--border-strong": "#8b846f",
    "--accent-rubric": "#3f4e7a",
    "--accent-rubric-strong": "#303c5f",
    "--accent-brass": "#8b6a3f",
    "--accent-arcane": "#5e4d87",
    "--domain-stat-core": "#3f4e7a",
    "--domain-stat-combat": "#5b4a30",
    "--domain-branch": "#5e4d87",
    "--domain-world-lock": "#8b6a3f",
    "--domain-snapshot-frozen": "#395d78",
    "--ink": "#1d2025",
    "--parchment": "#f5f2ea",
    ...SHARED_STATE_VARS,
  },
  "2C": {
    "--bg-canvas": "#f1ebdd",
    "--bg-surface": "#e7dfcf",
    "--bg-elevated": "#f7f3e9",
    "--bg-muted": "#d9cfbb",
    "--fg-primary": "#273126",
    "--fg-secondary": "#3f4b3d",
    "--fg-muted": "#5d6a58",
    "--border-default": "#b4a68d",
    "--border-strong": "#8f7f63",
    "--accent-rubric": "#2e5a46",
    "--accent-rubric-strong": "#244537",
    "--accent-brass": "#9c6a3a",
    "--accent-arcane": "#465d4d",
    "--domain-stat-core": "#2e5a46",
    "--domain-stat-combat": "#644725",
    "--domain-branch": "#465d4d",
    "--domain-world-lock": "#9c6a3a",
    "--domain-snapshot-frozen": "#3b6073",
    "--ink": "#1b261c",
    "--parchment": "#f7f3e9",
    ...SHARED_STATE_VARS,
  },
  "2D": {
    "--bg-canvas": "#f5f0e3",
    "--bg-surface": "#eae2d0",
    "--bg-elevated": "#fbf8ef",
    "--bg-muted": "#ded2bc",
    "--fg-primary": "#1f2430",
    "--fg-secondary": "#3a4357",
    "--fg-muted": "#586177",
    "--border-default": "#b9ad94",
    "--border-strong": "#93866c",
    "--accent-rubric": "#2d4270",
    "--accent-rubric-strong": "#23345a",
    "--accent-brass": "#b2873b",
    "--accent-arcane": "#5f4a8a",
    "--domain-stat-core": "#2d4270",
    "--domain-stat-combat": "#7a5c28",
    "--domain-branch": "#5f4a8a",
    "--domain-world-lock": "#9a7430",
    "--domain-snapshot-frozen": "#3f5d7c",
    "--ink": "#161a23",
    "--parchment": "#fbf8ef",
    ...SHARED_STATE_VARS,
  },
  "2E": {
    "--bg-canvas": "#f7f4ed",
    "--bg-surface": "#ece7db",
    "--bg-elevated": "#fcfaf6",
    "--bg-muted": "#ddd6c8",
    "--fg-primary": "#1c1a17",
    "--fg-secondary": "#38342e",
    "--fg-muted": "#575047",
    "--border-default": "#b7ad9b",
    "--border-strong": "#8f826c",
    "--accent-rubric": "#6b1e1e",
    "--accent-rubric-strong": "#531717",
    "--accent-brass": "#6c5a3a",
    "--accent-arcane": "#4b5570",
    "--domain-stat-core": "#6b1e1e",
    "--domain-stat-combat": "#4f4128",
    "--domain-branch": "#4b5570",
    "--domain-world-lock": "#6c5a3a",
    "--domain-snapshot-frozen": "#3d596e",
    "--ink": "#141311",
    "--parchment": "#fcfaf6",
    ...SHARED_STATE_VARS,
  },
};

const FONT_VARS_BY_CODE: Record<FontCode, CssVars> = {
  baseline: {
    "--font-display": "var(--font-cinzel), serif",
    "--font-body": "var(--font-source-serif), serif",
    "--font-ui": "var(--font-inter), sans-serif",
  },
  serifUi: {
    "--font-display": "var(--font-cinzel), serif",
    "--font-body": "var(--font-source-serif), serif",
    "--font-ui": "var(--font-source-serif), Georgia, serif",
  },
  bookish: {
    "--font-display": "var(--font-cinzel), Georgia, serif",
    "--font-body": "var(--font-source-serif), Georgia, serif",
    "--font-ui": "Palatino Linotype, Book Antiqua, Palatino, Georgia, serif",
  },
  times: {
    "--font-display": "Times New Roman, Times, serif",
    "--font-body": "Times New Roman, Times, serif",
    "--font-ui": "Times New Roman, Times, serif",
  },
};

export function SandboxThemeShell({ labels, children }: SandboxThemeShellProps) {
  const [palette, setPalette] = useState<PaletteCode>("2D");
  const [font, setFont] = useState<FontCode>("bookish");

  const sandboxVars = useMemo<CssVars>(() => {
    return {
      ...PALETTE_VARS_BY_CODE[palette],
      ...FONT_VARS_BY_CODE[font],
    };
  }, [font, palette]);

  return (
    <div style={sandboxVars} className="surface-workbench min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
          <h2 className="font-display text-lg text-fg-primary">{labels.title}</h2>
          <p className="mt-1 text-sm text-fg-secondary">{labels.description}</p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.08em] text-fg-secondary">
              {labels.paletteLabel}
              <Select
                aria-label={labels.paletteLabel}
                value={palette}
                onChange={(event) => setPalette(event.target.value as PaletteCode)}
              >
                <option value="2A">2A - {labels.paletteOptions["2A"]}</option>
                <option value="2B">2B - {labels.paletteOptions["2B"]}</option>
                <option value="2C">2C - {labels.paletteOptions["2C"]}</option>
                <option value="2D">2D - {labels.paletteOptions["2D"]}</option>
                <option value="2E">2E - {labels.paletteOptions["2E"]}</option>
              </Select>
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.08em] text-fg-secondary">
              {labels.fontLabel}
              <Select
                aria-label={labels.fontLabel}
                value={font}
                onChange={(event) => setFont(event.target.value as FontCode)}
              >
                <option value="baseline">{labels.fontOptions.baseline}</option>
                <option value="serifUi">{labels.fontOptions.serifUi}</option>
                <option value="bookish">{labels.fontOptions.bookish}</option>
                <option value="times">{labels.fontOptions.times}</option>
              </Select>
            </label>
          </div>
        </section>

        {children}
      </div>
    </div>
  );
}
