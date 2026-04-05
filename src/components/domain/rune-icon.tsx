import type { SVGProps } from "react";

import { cn } from "@/lib/cn";
import type { RuneName } from "@/lib/design-system/tokens";

const runeGlyphByName: Record<RuneName, string> = {
  "rune-str": "STR",
  "rune-dex": "DEX",
  "rune-con": "CON",
  "rune-int": "INT",
  "rune-wis": "WIS",
  "rune-cha": "CHA",
  "rune-ac": "AC",
  "rune-hp": "HP",
  "rune-init": "INIT",
  "rune-spell-dc": "DC",
  "rune-branch": "BR",
  "rune-world-lock": "WL",
  "rune-snapshot-frozen": "SN",
  "rune-invalid-state": "!",
};

export interface RuneIconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: RuneName;
  label: string;
}

export function RuneIcon({ name, label, className, ...props }: RuneIconProps) {
  return (
    <svg
      aria-label={label}
      role="img"
      viewBox="0 0 24 24"
      className={cn("rune-icon size-5 text-domain-stat-core", className)}
      {...props}
    >
      <title>{label}</title>
      <rect x="1.25" y="1.25" width="21.5" height="21.5" rx="3" fill="currentColor" fillOpacity="0.12" />
      <rect
        x="1.25"
        y="1.25"
        width="21.5"
        height="21.5"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <text
        x="12"
        y="13.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="currentColor"
        fontSize="6"
        fontWeight="700"
      >
        {runeGlyphByName[name]}
      </text>
    </svg>
  );
}

type AppIconName = "workbench" | "codex" | "refresh" | "warning";

export interface AppIconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: AppIconName;
  label: string;
}

export function AppIcon({ name, label, className, ...props }: AppIconProps) {
  const iconPath =
    name === "workbench"
      ? "M3 5.5h18M3 11.75h18M3 18h18"
      : name === "codex"
        ? "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4Zm0 0h10a3 3 0 0 1 3 3"
        : name === "refresh"
          ? "M4 12a8 8 0 0 1 13.2-6l2.3 2.2M20 12a8 8 0 0 1-13.2 6L4.5 15.8"
          : "M12 4 4 20h16L12 4Zm0 5v5m0 3h.01";

  return (
    <svg
      aria-label={label}
      role="img"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-5 text-fg-secondary", className)}
      {...props}
    >
      <title>{label}</title>
      <path d={iconPath} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
