"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type WorkbenchStepStatus = "idle" | "complete" | "warning";

interface CharacterWorkbenchStep {
  id: string;
  label: string;
  status: WorkbenchStepStatus;
  isActive: boolean;
  onSelect: () => void;
}

interface CharacterWorkbenchShellProps {
  header: ReactNode;
  saveState: ReactNode;
  actions: ReactNode;
  steps: CharacterWorkbenchStep[];
  canvas: ReactNode;
  pulse: ReactNode;
}

function statusBadge(status: WorkbenchStepStatus) {
  if (status === "warning") {
    return {
      marker: "!",
      className: "border-state-danger/40 bg-state-danger/10 text-state-danger",
    };
  }

  if (status === "complete") {
    return {
      marker: "✓",
      className: "border-state-success/40 bg-state-success/10 text-state-success",
    };
  }

  return {
    marker: "○",
    className: "border-border-default bg-bg-muted text-fg-secondary",
  };
}

export function CharacterWorkbenchShell({
  header,
  saveState,
  actions,
  steps,
  canvas,
  pulse,
}: CharacterWorkbenchShellProps) {
  return (
    <div className="space-y-3">
      <section className="sticky top-2 z-20 space-y-2 rounded-radius-sm border border-border-default bg-bg-surface p-3 shadow-shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">{header}</div>
          <p className="text-xs text-fg-secondary" aria-live="polite">
            {saveState}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </section>

      <div className="grid items-stretch gap-3 lg:grid-cols-[14rem_minmax(0,1fr)_18rem]">
        <aside className="h-full rounded-radius-sm border border-border-default bg-bg-surface p-2">
          <ul className="flex gap-2 overflow-x-auto lg:h-full lg:flex-col lg:overflow-visible">
            {steps.map((step) => {
              const badge = statusBadge(step.status);

              return (
                <li key={step.id} className="shrink-0 lg:w-full">
                  <Button
                    density="compact"
                    intent={step.isActive ? "primary" : "neutral"}
                    onClick={step.onSelect}
                    aria-current={step.isActive ? "step" : undefined}
                    className="min-w-max justify-start lg:w-full lg:min-w-0"
                  >
                    <span className={`rounded-radius-sm border px-1 text-[10px] font-semibold ${badge.className}`}>
                      {badge.marker}
                    </span>
                    <span>{step.label}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="space-y-3">{canvas}</div>

        <aside className="rounded-radius-sm border border-border-default bg-bg-surface p-3 lg:sticky lg:top-28 lg:self-start">
          {pulse}
        </aside>
      </div>
    </div>
  );
}
