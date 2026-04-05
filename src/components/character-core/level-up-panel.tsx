"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { CharacterCatalogRef } from "@/server/ports/character-repository";

interface LevelUpPanelCopy {
  title: string;
  plan: string;
  finalize: string;
  planning: string;
  finalizing: string;
  multiclassConfirm: string;
  targetLevelLabel: string;
}

interface LevelUpPanelProps {
  copy: LevelUpPanelCopy;
  characterId: string;
  baseRevision: number;
  currentClassRef: CharacterCatalogRef;
  onFinalized: (revision: number, level: number) => void;
}

interface LevelPlanPayload {
  data: {
    plan: {
      targetLevel: number;
      classRef: CharacterCatalogRef;
      autoApplied: Array<{ code: string; description: string }>;
      requiresMulticlassConfirmation: boolean;
    };
  };
}

export function LevelUpPanel({
  copy,
  characterId,
  baseRevision,
  currentClassRef,
  onFinalized,
}: LevelUpPanelProps) {
  const [plan, setPlan] = useState<LevelPlanPayload["data"]["plan"] | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [confirmClassChange, setConfirmClassChange] = useState(false);

  return (
    <section className="space-y-3 rounded-radius-sm border border-border-default bg-bg-surface p-3">
      <h3 className="text-sm font-semibold text-fg-primary">{copy.title}</h3>

      {plan ? (
        <div className="space-y-2 rounded-radius-sm border border-border-default bg-bg-elevated p-2 text-sm text-fg-primary">
          <p>
            {copy.targetLevelLabel}: {plan.targetLevel}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-fg-secondary">
            {plan.autoApplied.map((item) => (
              <li key={item.code}>{item.description}</li>
            ))}
          </ul>
          {plan.requiresMulticlassConfirmation ? (
            <label className="flex items-start gap-2 text-xs text-fg-secondary">
              <input
                type="checkbox"
                checked={confirmClassChange}
                onChange={(event) => setConfirmClassChange(event.target.checked)}
              />
              <span>{copy.multiclassConfirm}</span>
            </label>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          density="compact"
          disabled={isPlanning}
          onClick={async () => {
            setIsPlanning(true);
            try {
              const response = await fetch(`/api/characters/${characterId}/level/plan`, {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  classRef: currentClassRef,
                }),
              });

              if (!response.ok) {
                return;
              }

              const payload = (await response.json()) as LevelPlanPayload;
              setPlan(payload.data.plan);
            } finally {
              setIsPlanning(false);
            }
          }}
        >
          {isPlanning ? copy.planning : copy.plan}
        </Button>

        <Button
          density="compact"
          intent="primary"
          disabled={isFinalizing || !plan || (plan.requiresMulticlassConfirmation && !confirmClassChange)}
          onClick={async () => {
            if (!plan) {
              return;
            }

            setIsFinalizing(true);
            try {
              const response = await fetch(`/api/characters/${characterId}/level/finalize`, {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  baseRevision,
                  classRef: plan.classRef,
                  confirmClassChange,
                }),
              });

              if (!response.ok) {
                return;
              }

              const payload = (await response.json()) as {
                data: {
                  revision: number;
                  level: number;
                };
              };
              onFinalized(payload.data.revision, payload.data.level);
            } finally {
              setIsFinalizing(false);
            }
          }}
        >
          {isFinalizing ? copy.finalizing : copy.finalize}
        </Button>
      </div>
    </section>
  );
}
