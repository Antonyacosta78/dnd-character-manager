import { getTranslations } from "next-intl/server";

import {
  type AppShellNavigationProps,
} from "@/components/patterns/app-shell-navigation";

export interface CoreShellRouteLabels {
  characters: {
    title: string;
    subtitle: string;
  };
  worlds: {
    title: string;
    subtitle: string;
  };
  adventures: {
    title: string;
    subtitle: string;
  };
  characterBranches: {
    title: string;
    subtitle: string;
    entitySubtitleTemplate: string;
  };
  adventureSessions: {
    title: string;
    subtitle: string;
    entitySubtitleTemplate: string;
  };
}

export interface CoreShellConfig {
  navigation: Omit<AppShellNavigationProps, "title" | "subtitle" | "children">;
  routeLabels: CoreShellRouteLabels;
}

export async function getCoreShellConfig(): Promise<CoreShellConfig> {
  const t = await getTranslations("common");

  const navigation: Omit<AppShellNavigationProps, "title" | "subtitle" | "children"> = {
    labels: {
      primaryAriaLabel: t("appShellNavigation.primaryAriaLabel"),
      topUtilityAriaLabel: t("appShellNavigation.topUtilityAriaLabel"),
      utilityAriaLabel: t("appShellNavigation.utilityAriaLabel"),
      mobileMenuOpen: t("appShellNavigation.mobileMenuOpen"),
      mobileMenuClose: t("appShellNavigation.mobileMenuClose"),
      mobileBack: t("appShellNavigation.mobileBack"),
      submenuExpand: t("appShellNavigation.submenuExpand"),
      submenuCollapse: t("appShellNavigation.submenuCollapse"),
      accountLabel: t("appShellNavigation.account.label"),
      accountTooltip: t("appShellNavigation.account.tooltip"),
      accountOpenMenu: t("appShellNavigation.account.openMenu"),
      signOut: t("appShellNavigation.account.signOut"),
      signOutPending: t("appShellNavigation.account.signOutPending"),
      settingsTooltip: t("appShellNavigation.items.settings.tooltip"),
    },
    navItems: [
      {
        key: "characters",
        label: t("appShellNavigation.items.characters.label"),
        href: "/characters",
        tooltip: t("appShellNavigation.items.characters.tooltip"),
        submenu: [
          {
            key: "branches",
            label: t("appShellNavigation.items.branches.label"),
            href: "/characters/branches",
            tooltip: t("appShellNavigation.items.branches.tooltip"),
          },
        ],
      },
      {
        key: "worlds",
        label: t("appShellNavigation.items.worlds.label"),
        href: "/worlds",
        tooltip: t("appShellNavigation.items.worlds.tooltip"),
      },
      {
        key: "adventures",
        label: t("appShellNavigation.items.adventures.label"),
        href: "/adventures",
        tooltip: t("appShellNavigation.items.adventures.tooltip"),
        submenu: [
          {
            key: "sessions",
            label: t("appShellNavigation.items.sessions.label"),
            href: "/adventures/sessions",
            tooltip: t("appShellNavigation.items.sessions.tooltip"),
            locked: {
              reason: t("appShellNavigation.locked.reason"),
              guidance: t("appShellNavigation.locked.guidance"),
            },
          },
        ],
      },
    ],
    settingsLabels: {
      triggerLabel: t("appShellNavigation.items.settings.label"),
      title: t("designSystem.globalSettings.title"),
      description: t("designSystem.globalSettings.description"),
      dismissLabel: t("designSystem.globalSettings.dismiss"),
      sectionsAriaLabel: t("designSystem.globalSettings.sectionsAria"),
      sectionAppearance: t("designSystem.globalSettings.sections.appearance"),
      sectionLanguage: t("designSystem.globalSettings.sections.language"),
      appearanceTitle: t("designSystem.globalSettings.appearance.title"),
      appearanceDescription: t("designSystem.globalSettings.appearance.description"),
      paletteLabel: t("designSystem.globalSettings.appearance.paletteLabel"),
      fontLabel: t("designSystem.globalSettings.appearance.fontLabel"),
      radiusLabel: t("designSystem.globalSettings.appearance.radiusLabel"),
      radiusDescription: t("designSystem.globalSettings.appearance.radiusDescription"),
      paletteOptions: {
        "2A": t("designSystem.sandbox.palette.options.2A.name"),
        "2B": t("designSystem.sandbox.palette.options.2B.name"),
        "2C": t("designSystem.sandbox.palette.options.2C.name"),
        "2D": t("designSystem.sandbox.palette.options.2D.name"),
        "2E": t("designSystem.sandbox.palette.options.2E.name"),
      },
      fontOptions: {
        baseline: t("designSystem.sandbox.switcher.fontOptions.baseline"),
        serifUi: t("designSystem.sandbox.switcher.fontOptions.serifUi"),
        bookish: t("designSystem.sandbox.switcher.fontOptions.bookish"),
        times: t("designSystem.sandbox.switcher.fontOptions.times"),
      },
      radiusOptions: {
        none: t("designSystem.globalSettings.appearance.radiusOptions.none"),
        subtle: t("designSystem.globalSettings.appearance.radiusOptions.subtle"),
        moderate: t("designSystem.globalSettings.appearance.radiusOptions.moderate"),
        pronounced: t("designSystem.globalSettings.appearance.radiusOptions.pronounced"),
      },
      languageTitle: t("designSystem.globalSettings.language.title"),
      languageDescription: t("designSystem.globalSettings.language.description"),
      languageLabel: t("designSystem.globalSettings.language.languageLabel"),
      languageOptions: {
        en: t("designSystem.globalSettings.language.options.en"),
        es: t("designSystem.globalSettings.language.options.es"),
      },
      feedbackSaving: t("designSystem.globalSettings.feedback.saving"),
      feedbackSaved: t("designSystem.globalSettings.feedback.saved"),
      feedbackFailed: t("designSystem.globalSettings.feedback.failed"),
    },
  };

  const routeLabels: CoreShellRouteLabels = {
    characters: {
      title: t("auth.characters.title"),
      subtitle: t("auth.characters.protectedLabel"),
    },
    worlds: {
      title: t("appShellNavigation.routeTitles.worlds"),
      subtitle: t("appShellNavigation.routeSubtitles.worlds"),
    },
    adventures: {
      title: t("appShellNavigation.routeTitles.adventures"),
      subtitle: t("appShellNavigation.routeSubtitles.adventures"),
    },
    characterBranches: {
      title: t("appShellNavigation.routeTitles.characterBranches"),
      subtitle: t("appShellNavigation.routeSubtitles.characterBranches"),
      entitySubtitleTemplate: t("appShellNavigation.routeSubtitles.characterEntityBranches", {
        id: "{id}",
      }),
    },
    adventureSessions: {
      title: t("appShellNavigation.routeTitles.adventureSessions"),
      subtitle: t("appShellNavigation.routeSubtitles.adventureSessions"),
      entitySubtitleTemplate: t("appShellNavigation.routeSubtitles.adventureEntitySessions", {
        id: "{id}",
      }),
    },
  };

  return {
    navigation,
    routeLabels,
  };
}
