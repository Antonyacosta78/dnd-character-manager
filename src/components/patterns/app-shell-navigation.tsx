"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { AppIcon } from "@/components/domain/rune-icon";
import {
  GlobalSettingsModal,
  type GlobalSettingsModalLabels,
} from "@/components/settings/global-settings-modal";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

type DesktopSubmenuKey = "characters" | "adventures";
type MobilePanel = "root" | "characters" | "adventures";

const DESKTOP_SUBMENU_STORAGE_KEY = "app-shell.desktop-submenus";

interface LockedState {
  reason: string;
  guidance: string;
}

interface NavSubItem {
  key: "branches" | "sessions";
  label: string;
  href: string;
  tooltip: string;
  locked?: LockedState;
}

interface NavItem {
  key: "characters" | "worlds" | "adventures";
  label: string;
  href: string;
  tooltip: string;
  locked?: LockedState;
  submenu?: NavSubItem[];
}

interface AppShellNavigationLabels {
  primaryAriaLabel: string;
  topUtilityAriaLabel: string;
  utilityAriaLabel: string;
  mobileMenuOpen: string;
  mobileMenuClose: string;
  mobileBack: string;
  submenuExpand: string;
  submenuCollapse: string;
  accountLabel: string;
  accountTooltip: string;
  accountOpenMenu: string;
  signOut: string;
  signOutPending: string;
  settingsTooltip: string;
}

export interface AppShellNavigationProps {
  title: string;
  subtitle: string;
  labels: AppShellNavigationLabels;
  settingsLabels: GlobalSettingsModalLabels;
  navItems: NavItem[];
  children: ReactNode;
}

function getDesktopSubmenuDefaults() {
  return {
    characters: false,
    adventures: false,
  } as Record<DesktopSubmenuKey, boolean>;
}

function isSubmenuRouteActive(pathname: string, key: NavSubItem["key"]) {
  if (key === "branches") {
    return /^\/characters(?:\/[^/]+)?\/branches$/.test(pathname);
  }

  return /^\/adventures(?:\/[^/]+)?\/sessions$/.test(pathname);
}

function isItemActive(pathname: string, item: NavItem) {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }

  return item.submenu?.some((subItem) => isSubmenuRouteActive(pathname, subItem.key)) ?? false;
}

export function AppShellNavigation({
  title,
  subtitle,
  labels,
  settingsLabels,
  navItems,
  children,
}: AppShellNavigationProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("root");
  const [desktopSubmenus, setDesktopSubmenus] = useState<Record<DesktopSubmenuKey, boolean>>(() => {
    if (typeof window === "undefined") {
      return getDesktopSubmenuDefaults();
    }

    try {
      const rawPreference = localStorage.getItem(DESKTOP_SUBMENU_STORAGE_KEY);

      if (!rawPreference) {
        return getDesktopSubmenuDefaults();
      }

      const parsedPreference = JSON.parse(rawPreference) as Partial<Record<DesktopSubmenuKey, boolean>>;

      return {
        characters: parsedPreference.characters === true,
        adventures: parsedPreference.adventures === true,
      };
    } catch {
      return getDesktopSubmenuDefaults();
    }
  });

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();

      if (mobilePanel !== "root") {
        setMobilePanel("root");
        return;
      }

      setMobileOpen(false);
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen, mobilePanel]);

  useEffect(() => {
    if (!mobileOpen || typeof document === "undefined") {
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
  }, [mobileOpen]);

  function toggleDesktopSubmenu(submenuKey: DesktopSubmenuKey) {
    setDesktopSubmenus((current) => {
      const next = {
        ...current,
        [submenuKey]: !current[submenuKey],
      };

      try {
        localStorage.setItem(DESKTOP_SUBMENU_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // no-op: preference persistence is optional
      }

      return next;
    });
  }

  const visibleDesktopSubmenus = useMemo(() => {
    const hasActiveSubmenuFor = (parentKey: DesktopSubmenuKey) =>
      navItems
        .find((item) => item.key === parentKey)
        ?.submenu?.some((subItem) => isSubmenuRouteActive(pathname, subItem.key)) ?? false;

    return {
      characters: desktopSubmenus.characters || hasActiveSubmenuFor("characters"),
      adventures: desktopSubmenus.adventures || hasActiveSubmenuFor("adventures"),
    };
  }, [desktopSubmenus, navItems, pathname]);

  return (
    <main className="min-h-screen bg-bg-canvas font-ui text-fg-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-[104rem] gap-4 px-3 py-3 sm:px-4 lg:px-6">
        <aside
          className="hidden w-72 shrink-0 rounded-radius-sm border border-border-strong bg-bg-surface p-3 shadow-shadow-soft lg:flex lg:flex-col"
          aria-label={labels.primaryAriaLabel}
        >
          <header className="border-b border-border-default pb-3">
            <p className="text-xs uppercase tracking-[0.08em] text-fg-muted">{title}</p>
            <p className="mt-1 text-xs text-fg-secondary">{subtitle}</p>
          </header>

          <nav aria-label={labels.primaryAriaLabel} className="mt-3 flex-1 space-y-1">
            {navItems.map((item) => {
              const active = isItemActive(pathname, item);
              const submenuKey = item.key === "characters" || item.key === "adventures" ? item.key : null;
              const submenuVisible = submenuKey ? visibleDesktopSubmenus[submenuKey] : false;

              return (
                <div key={item.key} className="space-y-1">
                  <DesktopNavItem item={item} active={active} />

                  {item.submenu && submenuKey ? (
                    <div className="space-y-1">
                      <Button
                        type="button"
                        density="compact"
                        intent="ghost"
                        aria-label={submenuVisible ? labels.submenuCollapse : labels.submenuExpand}
                        title={submenuVisible ? labels.submenuCollapse : labels.submenuExpand}
                        onClick={() => toggleDesktopSubmenu(submenuKey)}
                        className="min-h-8 w-8 justify-center px-0"
                      >
                        <span aria-hidden="true">{submenuVisible ? "▾" : "▸"}</span>
                      </Button>

                      {submenuVisible ? (
                        <ul className="space-y-1 pl-3">
                          {item.submenu.map((subItem) => (
                            <li key={subItem.key}>
                              <DesktopSubNavItem subItem={subItem} active={isSubmenuRouteActive(pathname, subItem.key)} />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-border-default pt-3">
            <nav aria-label={labels.utilityAriaLabel}>
              <GlobalSettingsModal
                labels={settingsLabels}
                triggerStyle="utility"
                triggerText={settingsLabels.triggerLabel}
                triggerTitle={labels.settingsTooltip}
              />
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="rounded-radius-sm border border-border-strong bg-bg-surface p-3 shadow-shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  type="button"
                  density="compact"
                  intent="neutral"
                  className="lg:hidden"
                  aria-label={labels.mobileMenuOpen}
                  title={labels.mobileMenuOpen}
                  onClick={() => setMobileOpen(true)}
                >
                  <AppIcon name="workbench" label={labels.mobileMenuOpen} className="size-4" />
                </Button>

                <div className="min-w-0">
                  <h1 className="truncate font-display text-lg text-fg-primary sm:text-xl">{title}</h1>
                  <p className="truncate text-xs text-fg-secondary sm:text-sm">{subtitle}</p>
                </div>
              </div>

              <nav className="shrink-0" aria-label={labels.topUtilityAriaLabel}>
                <AccountMenu labels={labels} />
              </nav>
            </div>
          </header>

          <section className="min-h-0 flex-1">{children}</section>
        </div>
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 bg-ink/45 lg:hidden"
            aria-label={labels.mobileMenuClose}
            onClick={() => {
              setMobilePanel("root");
              setMobileOpen(false);
            }}
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label={labels.primaryAriaLabel}
            className="fixed left-0 top-0 z-30 flex h-full w-[min(24rem,90vw)] flex-col border-r border-border-strong bg-bg-elevated p-3 shadow-shadow-panel lg:hidden"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border-default pb-2">
              {mobilePanel === "root" ? (
                <p className="text-xs uppercase tracking-[0.08em] text-fg-muted">{labels.primaryAriaLabel}</p>
              ) : (
                <Button
                  type="button"
                  density="compact"
                  intent="ghost"
                  aria-label={labels.mobileBack}
                  title={labels.mobileBack}
                  className="min-h-8 w-8 justify-center px-0"
                  onClick={() => setMobilePanel("root")}
                >
                  <span aria-hidden="true">←</span>
                </Button>
              )}

              <Button
                type="button"
                density="compact"
                intent="ghost"
                aria-label={labels.mobileMenuClose}
                title={labels.mobileMenuClose}
                className="min-h-8 w-8 justify-center px-0"
                onClick={() => {
                  setMobilePanel("root");
                  setMobileOpen(false);
                }}
              >
                <span aria-hidden="true">×</span>
              </Button>
            </div>

            {mobilePanel === "root" ? (
              <nav aria-label={labels.primaryAriaLabel} className="mt-3 space-y-1">
                {navItems.map((item) => (
                  <MobileNavItem
                    key={item.key}
                    item={item}
                    active={isItemActive(pathname, item)}
                    drillInLabel={labels.submenuExpand}
                    onEnterSubmenu={() =>
                      item.key === "characters" || item.key === "adventures" ? setMobilePanel(item.key) : undefined
                    }
                  />
                ))}

                <div className="mt-4 border-t border-border-default pt-3">
                  <GlobalSettingsModal
                    labels={settingsLabels}
                    triggerStyle="utility"
                    triggerText={settingsLabels.triggerLabel}
                    triggerTitle={labels.settingsTooltip}
                  />
                </div>
              </nav>
            ) : (
              <nav aria-label={labels.primaryAriaLabel} className="mt-3 space-y-1">
                {navItems
                  .find((item) => item.key === mobilePanel)
                  ?.submenu?.map((subItem) => (
                    <MobileSubNavItem key={subItem.key} subItem={subItem} active={isSubmenuRouteActive(pathname, subItem.key)} />
                  ))}
              </nav>
            )}
          </aside>
        </>
      ) : null}
    </main>
  );
}

function NavLabelWithLock({ label, locked }: { label: string; locked?: LockedState }) {
  return (
    <span className="min-w-0">
      <span className="block truncate">{label}</span>
      {locked ? (
        <span className="mt-0.5 block text-[11px] text-fg-muted">
          {locked.reason} {locked.guidance}
        </span>
      ) : null}
    </span>
  );
}

function DesktopNavItem({ item, active }: { item: NavItem; active: boolean }) {
  const classes = cn(
    "flex w-full min-h-9 items-center gap-2 rounded-radius-xs border px-3 py-2 text-left text-sm font-medium transition-colors motion-reduce:transition-none",
    active
      ? "border-accent-rubric bg-bg-elevated text-fg-primary"
      : "border-transparent bg-transparent text-fg-secondary hover:bg-bg-muted",
    item.locked ? "cursor-not-allowed opacity-70" : "",
  );

  if (item.locked) {
    return (
      <span className={classes} aria-disabled="true" title={item.tooltip}>
        <NavLabelWithLock label={item.label} locked={item.locked} />
      </span>
    );
  }

  return (
    <Link href={item.href} title={item.tooltip} className={classes} aria-current={active ? "page" : undefined}>
      <NavLabelWithLock label={item.label} />
    </Link>
  );
}

function DesktopSubNavItem({ subItem, active }: { subItem: NavSubItem; active: boolean }) {
  const classes = cn(
    "flex w-full min-h-8 items-center rounded-radius-xs border px-3 py-1.5 text-xs font-medium transition-colors motion-reduce:transition-none",
    active
      ? "border-accent-rubric bg-bg-elevated text-fg-primary"
      : "border-transparent text-fg-secondary hover:bg-bg-muted",
    subItem.locked ? "cursor-not-allowed opacity-70" : "",
  );

  if (subItem.locked) {
    return (
      <span className={classes} aria-disabled="true" title={subItem.tooltip}>
        <NavLabelWithLock label={subItem.label} locked={subItem.locked} />
      </span>
    );
  }

  return (
    <Link href={subItem.href} title={subItem.tooltip} className={classes} aria-current={active ? "page" : undefined}>
      <NavLabelWithLock label={subItem.label} />
    </Link>
  );
}

function MobileNavItem({
  item,
  active,
  drillInLabel,
  onEnterSubmenu,
}: {
  item: NavItem;
  active: boolean;
  drillInLabel: string;
  onEnterSubmenu: () => void;
}) {
  const classes = cn(
    "flex w-full min-h-10 items-center justify-between gap-2 rounded-radius-xs border px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none",
    active
      ? "border-accent-rubric bg-bg-surface text-fg-primary"
      : "border-transparent text-fg-secondary hover:bg-bg-muted",
    item.locked ? "cursor-not-allowed opacity-70" : "",
  );

  if (item.locked) {
    return (
      <span className={classes} aria-disabled="true" title={item.tooltip}>
        <NavLabelWithLock label={item.label} locked={item.locked} />
      </span>
    );
  }

  if (item.submenu) {
    return (
      <div className={classes} title={item.tooltip}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className="min-w-0 flex-1"
        >
          <NavLabelWithLock label={item.label} />
        </Link>

        <button
          type="button"
          onClick={onEnterSubmenu}
          className="rounded-radius-xs border border-border-default bg-bg-surface px-2 py-1 text-xs text-fg-secondary"
          aria-label={drillInLabel}
        >
          ›
        </button>
      </div>
    );
  }

  return (
    <Link href={item.href} title={item.tooltip} className={classes} aria-current={active ? "page" : undefined}>
      <NavLabelWithLock label={item.label} />
    </Link>
  );
}

function MobileSubNavItem({ subItem, active }: { subItem: NavSubItem; active: boolean }) {
  const classes = cn(
    "flex w-full min-h-10 items-center rounded-radius-xs border px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none",
    active
      ? "border-accent-rubric bg-bg-surface text-fg-primary"
      : "border-transparent text-fg-secondary hover:bg-bg-muted",
    subItem.locked ? "cursor-not-allowed opacity-70" : "",
  );

  if (subItem.locked) {
    return (
      <span className={classes} aria-disabled="true" title={subItem.tooltip}>
        <NavLabelWithLock label={subItem.label} locked={subItem.locked} />
      </span>
    );
  }

  return (
    <Link href={subItem.href} title={subItem.tooltip} className={classes} aria-current={active ? "page" : undefined}>
      <NavLabelWithLock label={subItem.label} />
    </Link>
  );
}

function AccountMenu({ labels }: { labels: AppShellNavigationLabels }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      setOpen(false);
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setOpen(false);
      }
    }}>
      <Button
        type="button"
        density="compact"
        intent="neutral"
        title={labels.accountTooltip}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={labels.accountOpenMenu}
        onClick={() => setOpen((current) => !current)}
      >
        {labels.accountLabel}
      </Button>

      {open ? (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-44 rounded-radius-sm border border-border-default bg-bg-elevated p-2 shadow-shadow-panel">
          <Button
            type="button"
            density="compact"
            intent="ghost"
            role="menuitem"
            className="w-full justify-start"
            disabled={pending}
            onClick={async () => {
              setPending(true);

              await authClient.signOut();

              router.push("/sign-in");
              router.refresh();
            }}
          >
            {pending ? labels.signOutPending : labels.signOut}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
