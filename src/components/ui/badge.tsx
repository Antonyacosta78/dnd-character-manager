import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { INTENT_CLASS_BY_INTENT, type Intent } from "@/lib/design-system/tokens";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  intent?: Intent;
}

export function Badge({ className, intent = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-radius-xs border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em]",
        INTENT_CLASS_BY_INTENT[intent],
        className,
      )}
      {...props}
    />
  );
}
