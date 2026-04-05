"use client";

import { createSettingFeedbackSelector } from "@/client/state/global-settings.selectors";
import {
  useGlobalSettings,
  useGlobalSettingsActions,
} from "@/client/state/global-settings.store";
import {
  GLOBAL_THEME_FONTS,
  GLOBAL_THEME_PALETTES,
  GLOBAL_THEME_RADII,
  type ThemeFontCode,
  type ThemePaletteCode,
  type ThemeRadiusCode,
} from "@/client/state/global-settings.types";
import {
  SettingSaveFeedback,
  type SettingSaveFeedbackLabels,
} from "@/components/settings/setting-save-feedback";
import { Select } from "@/components/ui/select";

export interface ThemeSettingsPanelLabels {
  title: string;
  description: string;
  paletteLabel: string;
  fontLabel: string;
  radiusLabel: string;
  radiusDescription: string;
  paletteOptions: Record<ThemePaletteCode, string>;
  fontOptions: Record<ThemeFontCode, string>;
  radiusOptions: Record<ThemeRadiusCode, string>;
  feedback: SettingSaveFeedbackLabels;
}

function isThemePaletteCode(value: string): value is ThemePaletteCode {
  return GLOBAL_THEME_PALETTES.includes(value as ThemePaletteCode);
}

function isThemeFontCode(value: string): value is ThemeFontCode {
  return GLOBAL_THEME_FONTS.includes(value as ThemeFontCode);
}

function isThemeRadiusCode(value: string): value is ThemeRadiusCode {
  return GLOBAL_THEME_RADII.includes(value as ThemeRadiusCode);
}

export function ThemeSettingsPanel({ labels }: { labels: ThemeSettingsPanelLabels }) {
  const palette = useGlobalSettings((state) => state.theme.palette);
  const font = useGlobalSettings((state) => state.theme.font);
  const radius = useGlobalSettings((state) => state.theme.radius);
  const paletteFeedback = useGlobalSettings(createSettingFeedbackSelector("theme.palette"));
  const fontFeedback = useGlobalSettings(createSettingFeedbackSelector("theme.font"));
  const radiusFeedback = useGlobalSettings(createSettingFeedbackSelector("theme.radius"));
  const { setThemePalette, setThemeFont, setThemeRadius } = useGlobalSettingsActions();

  return (
    <section aria-labelledby="global-settings-appearance-title" className="space-y-3">
      <header>
        <h3 id="global-settings-appearance-title" className="font-display text-lg text-fg-primary">
          {labels.title}
        </h3>
        <p className="mt-1 text-sm text-fg-secondary">{labels.description}</p>
      </header>

      <div className="space-y-3">
        <div className="relative rounded-radius-sm border border-border-default bg-bg-surface p-3">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-secondary">
            {labels.paletteLabel}
          </label>
          <div className="relative mt-1">
            <Select
              aria-label={labels.paletteLabel}
              density="compact"
              value={palette}
              onChange={(event) => {
                const value = event.target.value;

                if (!isThemePaletteCode(value)) {
                  return;
                }

                void setThemePalette(value);
              }}
            >
              {GLOBAL_THEME_PALETTES.map((paletteCode) => (
                <option key={paletteCode} value={paletteCode}>
                  {paletteCode} - {labels.paletteOptions[paletteCode]}
                </option>
              ))}
            </Select>

            <SettingSaveFeedback feedback={paletteFeedback} labels={labels.feedback} />
          </div>
        </div>

        <div className="relative rounded-radius-sm border border-border-default bg-bg-surface p-3">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-secondary">
            {labels.fontLabel}
          </label>
          <div className="relative mt-1">
            <Select
              aria-label={labels.fontLabel}
              density="compact"
              value={font}
              onChange={(event) => {
                const value = event.target.value;

                if (!isThemeFontCode(value)) {
                  return;
                }

                void setThemeFont(value);
              }}
            >
              {GLOBAL_THEME_FONTS.map((fontCode) => (
                <option key={fontCode} value={fontCode}>
                  {labels.fontOptions[fontCode]}
                </option>
              ))}
            </Select>

            <SettingSaveFeedback feedback={fontFeedback} labels={labels.feedback} />
          </div>
        </div>

        <div className="relative rounded-radius-sm border border-border-default bg-bg-surface p-3">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-secondary">
            {labels.radiusLabel}
          </label>
          <div className="relative mt-1">
            <Select
              aria-label={labels.radiusLabel}
              density="compact"
              value={radius}
              onChange={(event) => {
                const value = event.target.value;

                if (!isThemeRadiusCode(value)) {
                  return;
                }

                void setThemeRadius(value);
              }}
            >
              {GLOBAL_THEME_RADII.map((radiusCode) => (
                <option key={radiusCode} value={radiusCode}>
                  {labels.radiusOptions[radiusCode]}
                </option>
              ))}
            </Select>

            <SettingSaveFeedback feedback={radiusFeedback} labels={labels.feedback} />
          </div>

          <p className="mt-2 text-xs text-fg-muted">{labels.radiusDescription}</p>
        </div>
      </div>
    </section>
  );
}
