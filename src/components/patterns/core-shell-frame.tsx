"use client";

import { usePathname } from "next/navigation";

import {
  AppShellNavigation,
  type AppShellNavigationProps,
} from "@/components/patterns/app-shell-navigation";
import { type CoreShellRouteLabels } from "@/components/patterns/core-app-shell";

interface ResolvedRouteCopy {
  title: string;
  subtitle: string;
}

interface CoreShellFrameProps extends Omit<AppShellNavigationProps, "title" | "subtitle"> {
  routeLabels: CoreShellRouteLabels;
}

function resolveEntitySubtitle(template: string, id: string) {
  return template.replace("{id}", id);
}

function resolveRouteCopy(pathname: string, routeLabels: CoreShellRouteLabels): ResolvedRouteCopy {
  const characterEntityMatch = pathname.match(/^\/characters\/([^/]+)\/branches$/);

  if (characterEntityMatch?.[1]) {
    const id = decodeURIComponent(characterEntityMatch[1]);

    return {
      title: routeLabels.characterBranches.title,
      subtitle: resolveEntitySubtitle(routeLabels.characterBranches.entitySubtitleTemplate, id),
    };
  }

  if (pathname === "/characters/branches") {
    return {
      title: routeLabels.characterBranches.title,
      subtitle: routeLabels.characterBranches.subtitle,
    };
  }

  const adventureEntityMatch = pathname.match(/^\/adventures\/([^/]+)\/sessions$/);

  if (adventureEntityMatch?.[1]) {
    const id = decodeURIComponent(adventureEntityMatch[1]);

    return {
      title: routeLabels.adventureSessions.title,
      subtitle: resolveEntitySubtitle(routeLabels.adventureSessions.entitySubtitleTemplate, id),
    };
  }

  if (pathname === "/adventures/sessions") {
    return {
      title: routeLabels.adventureSessions.title,
      subtitle: routeLabels.adventureSessions.subtitle,
    };
  }

  if (pathname === "/worlds") {
    return {
      title: routeLabels.worlds.title,
      subtitle: routeLabels.worlds.subtitle,
    };
  }

  if (pathname === "/adventures") {
    return {
      title: routeLabels.adventures.title,
      subtitle: routeLabels.adventures.subtitle,
    };
  }

  return {
    title: routeLabels.characters.title,
    subtitle: routeLabels.characters.subtitle,
  };
}

export function CoreShellFrame({ routeLabels, children, ...navigationProps }: CoreShellFrameProps) {
  const pathname = usePathname();
  const routeCopy = resolveRouteCopy(pathname, routeLabels);

  return (
    <AppShellNavigation title={routeCopy.title} subtitle={routeCopy.subtitle} {...navigationProps}>
      {children}
    </AppShellNavigation>
  );
}
