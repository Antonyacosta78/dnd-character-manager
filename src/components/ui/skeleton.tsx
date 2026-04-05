import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-radius-xs bg-bg-muted motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
