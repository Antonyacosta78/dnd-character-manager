import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";
import { INTENT_CLASS_BY_INTENT, type Intent } from "@/lib/design-system/tokens";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  intent?: Intent;
  heading?: ReactNode;
  description?: ReactNode;
}

export function Alert({
  className,
  intent = "neutral",
  heading,
  description,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-radius-sm border px-4 py-3 text-sm shadow-shadow-soft",
        INTENT_CLASS_BY_INTENT[intent],
        className,
      )}
      {...props}
    >
      {heading ? <p className="font-semibold text-fg-primary">{heading}</p> : null}
      {description ? <p className="mt-1 text-fg-secondary">{description}</p> : null}
      {children ? <div className={cn(heading || description ? "mt-2" : undefined)}>{children}</div> : null}
    </div>
  );
}
