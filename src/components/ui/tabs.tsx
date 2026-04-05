import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TabItem {
  value: string;
  label: string;
  href?: string;
  icon?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeValue: string;
  ariaLabel: string;
  className?: string;
}

export function Tabs({ items, activeValue, ariaLabel, className }: TabsProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-radius-sm border border-border-default bg-bg-surface p-1",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.value === activeValue;

        const classes = cn(
          "inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-radius-xs border px-3 py-1 text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-rubric focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas",
          isActive
            ? "border-accent-rubric bg-bg-elevated text-fg-primary"
            : "border-transparent bg-transparent text-fg-secondary hover:bg-bg-muted",
        );

        if (item.href) {
          return (
            <a key={item.value} href={item.href} className={classes} aria-current={isActive ? "page" : undefined}>
              {item.icon}
              <span>{item.label}</span>
            </a>
          );
        }

        return (
          <span key={item.value} className={classes} aria-current={isActive ? "page" : undefined}>
            {item.icon}
            <span>{item.label}</span>
          </span>
        );
      })}
    </nav>
  );
}
