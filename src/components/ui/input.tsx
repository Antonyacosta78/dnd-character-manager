import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type InputDensity = "default" | "compact";

const densityClass: Record<InputDensity, string> = {
  default: "min-h-10 px-3 py-2 text-sm",
  compact: "min-h-8 px-2.5 py-1.5 text-xs",
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  density?: InputDensity;
  hasError?: boolean;
}

export function Input({ className, density = "default", hasError = false, ...props }: InputProps) {
  return (
    <input
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
