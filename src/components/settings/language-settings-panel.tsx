"use client";

import { useRouter } from "next/navigation";

import { createSettingFeedbackSelector } from "@/client/state/global-settings.selectors";
import {
  useGlobalSettings,
  useGlobalSettingsActions,
} from "@/client/state/global-settings.store";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/i18n/locales";
import {
  SettingSaveFeedback,
  type SettingSaveFeedbackLabels,
} from "@/components/settings/setting-save-feedback";
import { Select } from "@/components/ui/select";

export interface LanguageSettingsPanelLabels {
  title: string;
  description: string;
  languageLabel: string;
  languageOptions: Record<SupportedLocale, string>;
  feedback: SettingSaveFeedbackLabels;
}

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export function LanguageSettingsPanel({ labels }: { labels: LanguageSettingsPanelLabels }) {
  const router = useRouter();
  const language = useGlobalSettings((state) => state.language);
  const feedback = useGlobalSettings(createSettingFeedbackSelector("language"));
  const { setLanguage } = useGlobalSettingsActions();

  return (
    <section aria-labelledby="global-settings-language-title" className="space-y-3">
      <header>
        <h3 id="global-settings-language-title" className="font-display text-lg text-fg-primary">
          {labels.title}
        </h3>
        <p className="mt-1 text-sm text-fg-secondary">{labels.description}</p>
      </header>

      <div className="relative rounded-radius-sm border border-border-default bg-bg-surface p-3">
        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-secondary">
          {labels.languageLabel}
        </label>
        <div className="relative mt-1">
          <Select
            aria-label={labels.languageLabel}
            density="compact"
            value={language}
            onChange={async (event) => {
              const nextLocale = event.target.value;

              if (!isSupportedLocale(nextLocale)) {
                return;
              }

              await setLanguage(nextLocale);
              router.refresh();
            }}
          >
            {SUPPORTED_LOCALES.map((locale) => (
              <option key={locale} value={locale}>
                {labels.languageOptions[locale]}
              </option>
            ))}
          </Select>

          <SettingSaveFeedback feedback={feedback} labels={labels.feedback} />
        </div>
      </div>
    </section>
  );
}
