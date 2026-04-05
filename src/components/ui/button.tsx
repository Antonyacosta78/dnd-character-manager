import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ButtonIntent = "neutral" | "primary" | "danger" | "ghost";
type ButtonDensity = "default" | "compact";

const intentClass: Record<ButtonIntent, string> = {
  neutral:
    "border-border-default bg-bg-surface text-fg-primary hover:bg-bg-muted focus-visible:ring-accent-rubric",
  primary:
    "border-accent-rubric bg-accent-rubric text-parchment hover:bg-accent-rubric-strong focus-visible:ring-accent-rubric",
  danger:
    "border-state-danger bg-state-danger text-parchment hover:bg-state-danger-strong focus-visible:ring-state-danger",
  ghost:
    "border-transparent bg-transparent text-fg-secondary hover:bg-bg-muted focus-visible:ring-accent-brass",
};

const densityClass: Record<ButtonDensity, string> = {
  default: "min-h-10 px-4 py-2 text-sm",
  compact: "min-h-8 px-3 py-1.5 text-xs",
};

interface ButtonBaseProps {
  children: ReactNode;
  intent?: ButtonIntent;
  density?: ButtonDensity;
  className?: string;
}

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: "button";
    href?: never;
  };

type ButtonAsAnchor = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: "a";
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

export function Button({ className, intent = "neutral", density = "default", ...props }: ButtonProps) {
  const sharedClasses = cn(
    "inline-flex items-center justify-center gap-2 rounded-radius-sm border font-ui font-medium shadow-shadow-soft transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas disabled:cursor-not-allowed disabled:opacity-50",
    densityClass[density],
    intentClass[intent],
    className,
  );

  if (props.as === "a") {
    const { as, children, ...anchorProps } = props;
    void as;

    return (
      <a className={sharedClasses} {...anchorProps}>
        {children}
      </a>
    );
  }

  const { as, type = "button", children, ...buttonProps } = props;
  void as;

  return (
    <button type={type} className={sharedClasses} {...buttonProps}>
      {children}
    </button>
  );
}
