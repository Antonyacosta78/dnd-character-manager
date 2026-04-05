"use client";

import { cn } from "@/lib/cn";
import type { SettingFeedback } from "@/client/state/global-settings.types";

export interface SettingSaveFeedbackLabels {
  loading: string;
  saved: string;
  failed: string;
}

export interface SettingSaveFeedbackProps {
  feedback: SettingFeedback;
  labels: SettingSaveFeedbackLabels;
}

function resolveFeedbackText(feedback: SettingFeedback, labels: SettingSaveFeedbackLabels): string {
  if (feedback.state === "saving") {
    return labels.loading;
  }

  if (feedback.state === "saved") {
    return labels.saved;
  }

  return labels.failed;
}

export function SettingSaveFeedback({ feedback, labels }: SettingSaveFeedbackProps) {
  const isVisible = feedback.state !== "idle";

  if (!isVisible) {
    return null;
  }

  const text = resolveFeedbackText(feedback, labels);
  const intentClass =
    feedback.state === "saved"
      ? "border-state-success/60 bg-state-success/18 text-state-success"
      : feedback.state === "error"
        ? "border-state-danger/60 bg-state-danger/14 text-state-danger"
        : "border-state-info/60 bg-state-info/14 text-state-info";
  const animationClass =
    feedback.state === "saving"
      ? "opacity-0 settings-feedback-anim-enter"
      : "opacity-0 settings-feedback-anim-cycle";
  const glyph = feedback.state === "saved" ? "✓" : feedback.state === "error" ? "!" : "…";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-radius-sm border px-3 text-xs font-semibold tracking-[0.02em] shadow-shadow-soft",
        animationClass,
        intentClass,
      )}
    >
      <span aria-hidden="true" className="mr-1.5">
        {glyph}
      </span>
      <span>{text}</span>
    </div>
  );
}
