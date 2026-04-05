import type { ReactNode } from "react";

import { AppIcon } from "@/components/domain/rune-icon";
import {
  GlobalSettingsModal,
  type GlobalSettingsModalLabels,
} from "@/components/settings/global-settings-modal";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { SURFACE_CLASS_BY_MODE, type SurfaceMode } from "@/lib/design-system/tokens";

export interface SurfaceShellProps {
  mode: SurfaceMode;
  activeRoute: "workbench" | "codex";
  labels: {
    navAriaLabel: string;
    title: string;
    subtitle: string;
    appName: string;
    workbench: string;
    codex: string;
    quickAction: string;
    drawerTrigger: string;
    drawerTitle: string;
    drawerDescription: string;
    drawerDismiss: string;
    dialogTrigger: string;
    dialogTitle: string;
    dialogDescription: string;
    dialogDismiss: string;
    drawerInputLabel: string;
    drawerInputPlaceholder: string;
    drawerTextareaLabel: string;
    drawerTextareaPlaceholder: string;
    globalSettings: GlobalSettingsModalLabels;
  };
  children: ReactNode;
}

export function SurfaceShell({ mode, activeRoute, labels, children }: SurfaceShellProps) {
  return (
    <main className={cn("min-h-screen px-4 py-6 sm:px-6 lg:px-8", SURFACE_CLASS_BY_MODE[mode])}>
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-radius-sm border border-border-strong bg-bg-surface px-4 py-3 shadow-shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.08em] text-fg-muted">{labels.appName}</p>
              <h1 className="font-display text-2xl text-fg-primary">{labels.title}</h1>
              <p className="text-sm text-fg-secondary">{labels.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button density="compact" intent="primary">
                {labels.quickAction}
              </Button>

              <Drawer
                triggerLabel={labels.drawerTrigger}
                title={labels.drawerTitle}
                description={labels.drawerDescription}
                dismissLabel={labels.drawerDismiss}
              >
                <label
                  htmlFor="surface-drawer-input"
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-fg-secondary"
                >
                  {labels.drawerInputLabel}
                </label>
                <Input
                  id="surface-drawer-input"
                  className="mt-1"
                  placeholder={labels.drawerInputPlaceholder}
                  density="compact"
                />
                <label
                  htmlFor="surface-drawer-textarea"
                  className="mt-3 block text-xs font-semibold uppercase tracking-[0.08em] text-fg-secondary"
                >
                  {labels.drawerTextareaLabel}
                </label>
                <Textarea
                  id="surface-drawer-textarea"
                  className="mt-1"
                  placeholder={labels.drawerTextareaPlaceholder}
                  density="compact"
                />
              </Drawer>

              <Dialog
                triggerLabel={labels.dialogTrigger}
                title={labels.dialogTitle}
                description={labels.dialogDescription}
                dismissLabel={labels.dialogDismiss}
              >
                <p className="font-body text-sm text-fg-secondary">{labels.subtitle}</p>
              </Dialog>
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[16rem_1fr]">
            <aside className="rounded-radius-sm border border-border-default bg-bg-elevated p-2">
              <div className="flex items-center gap-2">
                <Tabs
                  ariaLabel={labels.navAriaLabel}
                  activeValue={activeRoute}
                  className="flex-1"
                  items={[
                    {
                      value: "workbench",
                      label: labels.workbench,
                      href: "/workbench",
                      icon: <AppIcon name="workbench" label={labels.workbench} />,
                    },
                    {
                      value: "codex",
                      label: labels.codex,
                      href: "/codex",
                      icon: <AppIcon name="codex" label={labels.codex} />,
                    },
                  ]}
                />

                <GlobalSettingsModal labels={labels.globalSettings} />
              </div>
            </aside>

            <div className="rounded-radius-sm border border-border-default bg-bg-elevated px-3 py-2 text-xs uppercase tracking-[0.08em] text-fg-muted">
              {labels.subtitle}
            </div>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
