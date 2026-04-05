import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type TextareaDensity = "default" | "compact";

const densityClass: Record<TextareaDensity, string> = {
  default: "min-h-24 px-3 py-2 text-sm",
  compact: "min-h-20 px-2.5 py-1.5 text-xs",
};

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  density?: TextareaDensity;
  hasError?: boolean;
}

export function Textarea({
  className,
  density = "default",
  hasError = false,
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-radius-sm border bg-bg-elevated text-fg-primary shadow-shadow-soft transition-colors motion-reduce:transition-none placeholder:text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas disabled:cursor-not-allowed disabled:opacity-60",
        densityClass[density],
        hasError
          ? "border-state-danger focus-visible:ring-state-danger"
          : "border-border-default focus-visible:ring-accent-rubric",
        className,
      )}
      {...props}
    />
  );
}
