"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import { AppIcon } from "@/components/domain/rune-icon";
import {
  type LanguageSettingsPanelLabels,
  LanguageSettingsPanel,
} from "@/components/settings/language-settings-panel";
import {
  type ThemeSettingsPanelLabels,
  ThemeSettingsPanel,
} from "@/components/settings/theme-settings-panel";
import { Button } from "@/components/ui/button";
import type {
  ThemeFontCode,
  ThemePaletteCode,
  ThemeRadiusCode,
} from "@/client/state/global-settings.types";
import { cn } from "@/lib/cn";

type GlobalSettingsSection = "appearance" | "language";

export interface GlobalSettingsModalLabels {
  triggerLabel: string;
  title: string;
  description: string;
  dismissLabel: string;
  sectionsAriaLabel: string;
  sectionAppearance: string;
  sectionLanguage: string;
  appearanceTitle: string;
  appearanceDescription: string;
  paletteLabel: string;
  fontLabel: string;
  radiusLabel: string;
  radiusDescription: string;
  paletteOptions: Record<ThemePaletteCode, string>;
  fontOptions: Record<ThemeFontCode, string>;
  radiusOptions: Record<ThemeRadiusCode, string>;
  languageTitle: string;
  languageDescription: string;
  languageLabel: string;
  languageOptions: Record<SupportedLocale, string>;
  feedbackSaving: string;
  feedbackSaved: string;
  feedbackFailed: string;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
  );
}

export function GlobalSettingsModal({ labels }: { labels: GlobalSettingsModalLabels }) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<GlobalSettingsSection>("appearance");
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const dismiss = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
      return;
    }

    const focusables = dialogRef.current ? getFocusableElements(dialogRef.current) : [];
    focusables[0]?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      dismiss();
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [dismiss, open]);

  const themeLabels = useMemo<ThemeSettingsPanelLabels>(
    () => ({
      title: labels.appearanceTitle,
      description: labels.appearanceDescription,
      paletteLabel: labels.paletteLabel,
      fontLabel: labels.fontLabel,
      radiusLabel: labels.radiusLabel,
      radiusDescription: labels.radiusDescription,
      paletteOptions: labels.paletteOptions,
      fontOptions: labels.fontOptions,
      radiusOptions: labels.radiusOptions,
      feedback: {
        loading: labels.feedbackSaving,
        saved: labels.feedbackSaved,
        failed: labels.feedbackFailed,
      },
    }),
    [
      labels.appearanceDescription,
      labels.appearanceTitle,
      labels.feedbackFailed,
      labels.feedbackSaved,
      labels.feedbackSaving,
      labels.fontLabel,
      labels.fontOptions,
      labels.paletteLabel,
      labels.paletteOptions,
      labels.radiusDescription,
      labels.radiusLabel,
      labels.radiusOptions,
    ],
  );

  const languageLabels = useMemo<LanguageSettingsPanelLabels>(
    () => ({
      title: labels.languageTitle,
      description: labels.languageDescription,
      languageLabel: labels.languageLabel,
      languageOptions: labels.languageOptions,
      feedback: {
        loading: labels.feedbackSaving,
        saved: labels.feedbackSaved,
        failed: labels.feedbackFailed,
      },
    }),
    [
      labels.feedbackFailed,
      labels.feedbackSaved,
      labels.feedbackSaving,
      labels.languageDescription,
      labels.languageLabel,
      labels.languageOptions,
      labels.languageTitle,
    ],
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={labels.triggerLabel}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-8 items-center justify-center gap-2 rounded-radius-sm border border-transparent bg-transparent px-2 py-1.5 text-xs font-medium text-fg-secondary shadow-shadow-soft transition-colors motion-reduce:transition-none hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-brass focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas"
      >
        <AppIcon name="settings" label={labels.triggerLabel} className="size-4" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={labels.dismissLabel}
            className="fixed inset-0 z-20 bg-ink/45 backdrop-blur-[1px] motion-reduce:backdrop-blur-none"
            onClick={dismiss}
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="fixed left-1/2 top-1/2 z-30 w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-radius-sm border border-border-strong bg-bg-elevated p-4 shadow-shadow-panel"
            onKeyDown={(event) => {
              if (event.key !== "Tab" || !dialogRef.current) {
                return;
              }

              const focusables = getFocusableElements(dialogRef.current);

              if (focusables.length === 0) {
                return;
              }

              const first = focusables[0];
              const last = focusables[focusables.length - 1];
              const target = event.target as HTMLElement | null;

              if (event.shiftKey && target === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && target === last) {
                event.preventDefault();
                first.focus();
              }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="font-display text-xl text-fg-primary">
                  {labels.title}
                </h2>
                <p id={descriptionId} className="mt-1 text-sm text-fg-secondary">
                  {labels.description}
                </p>
              </div>

              <Button type="button" intent="ghost" density="compact" onClick={dismiss}>
                {labels.dismissLabel}
              </Button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[14rem_1fr]">
              <nav
                aria-label={labels.sectionsAriaLabel}
                className="rounded-radius-sm border border-border-default bg-bg-surface p-2"
              >
                <ul className="space-y-1">
                  <li>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-radius-xs border px-3 py-2 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-rubric focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas",
                        activeSection === "appearance"
                          ? "border-accent-rubric bg-bg-elevated text-fg-primary"
                          : "border-transparent text-fg-secondary hover:bg-bg-muted",
                      )}
                      aria-current={activeSection === "appearance" ? "true" : undefined}
                      onClick={() => setActiveSection("appearance")}
                    >
                      {labels.sectionAppearance}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-radius-xs border px-3 py-2 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-rubric focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas",
                        activeSection === "language"
                          ? "border-accent-rubric bg-bg-elevated text-fg-primary"
                          : "border-transparent text-fg-secondary hover:bg-bg-muted",
                      )}
                      aria-current={activeSection === "language" ? "true" : undefined}
                      onClick={() => setActiveSection("language")}
                    >
                      {labels.sectionLanguage}
                    </button>
                  </li>
                </ul>
              </nav>

              <div className="rounded-radius-sm border border-border-default bg-bg-muted p-3">
                {activeSection === "appearance" ? (
                  <ThemeSettingsPanel labels={themeLabels} />
                ) : (
                  <LanguageSettingsPanel labels={languageLabels} />
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
