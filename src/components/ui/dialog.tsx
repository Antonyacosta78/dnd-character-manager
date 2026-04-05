"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useCallback, useEffect, useId, useState } from "react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  triggerLabel: string;
  title: string;
  description?: string;
  dismissLabel: string;
  children: ReactNode;
}

export function Dialog({
  className,
  triggerLabel,
  title,
  description,
  dismissLabel,
  children,
  ...props
}: DialogProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  const dismiss = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [dismiss, open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  return (
    <div className={cn("relative", className)} {...props}>
      <Button type="button" density="compact" intent="neutral" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={dismissLabel}
            className="fixed inset-0 z-10 bg-ink/45 backdrop-blur-[1px] motion-reduce:backdrop-blur-none"
            onClick={dismiss}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className="fixed left-1/2 top-1/2 z-20 w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-radius-sm border border-border-strong bg-bg-elevated p-4 shadow-shadow-panel"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 id={titleId} className="font-display text-lg leading-tight text-fg-primary">
                  {title}
                </h3>
                {description ? (
                  <p id={descriptionId} className="mt-1 text-sm text-fg-secondary">
                    {description}
                  </p>
                ) : null}
              </div>

              <Button type="button" density="compact" intent="ghost" onClick={dismiss}>
                {dismissLabel}
              </Button>
            </div>

            <div className="mt-4">{children}</div>
          </div>
        </>
      ) : null}
    </div>
  );
}
