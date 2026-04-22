"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ShareToggleCardCopy {
  title: string;
  description: string;
  enable: string;
  disable: string;
  enabled: string;
  disabled: string;
}

interface ShareToggleCardProps {
  copy: ShareToggleCardCopy;
  characterId: string;
  enabled: boolean;
  shareToken: string | null;
  onChange: (payload: { enabled: boolean; shareToken: string | null }) => void;
}

export function ShareToggleCard({
  copy,
  characterId,
  enabled,
  shareToken,
  onChange,
}: ShareToggleCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <section className="space-y-2 rounded-radius-sm border border-border-default bg-bg-surface p-3">
      <h3 className="text-sm font-semibold text-fg-primary">{copy.title}</h3>
      <p className="text-xs text-fg-secondary">{copy.description}</p>
      <p className="text-xs text-fg-secondary">{enabled ? copy.enabled : copy.disabled}</p>
      {shareToken ? <p className="text-xs text-fg-muted">/api/share/{shareToken}</p> : null}
      <Button
        density="compact"
        disabled={isSubmitting}
        onClick={async () => {
          setIsSubmitting(true);
          try {
            const response = await fetch(`/api/characters/${characterId}/share`, {
              method: "PATCH",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({ enabled: !enabled }),
            });

            if (!response.ok) {
              return;
            }

            const payload = (await response.json()) as {
              data: {
                share: {
                  shareEnabled: boolean;
                  shareToken: string | null;
                };
              };
            };

            onChange({
              enabled: payload.data.share.shareEnabled,
              shareToken: payload.data.share.shareToken,
            });
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {enabled ? copy.disable : copy.enable}
      </Button>
    </section>
  );
}
