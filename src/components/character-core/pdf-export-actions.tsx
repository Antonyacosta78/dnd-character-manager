"use client";

import { Button } from "@/components/ui/button";

interface PdfExportActionsCopy {
  title: string;
  summary: string;
  official: string;
  saveThenExport: string;
  exportLastSaved: string;
}

interface PdfExportActionsProps {
  copy: PdfExportActionsCopy;
  characterId: string;
  hasUnsavedChanges: boolean;
  onRequestSaveBeforeExport: () => void;
}

export function PdfExportActions({
  copy,
  characterId,
  hasUnsavedChanges,
  onRequestSaveBeforeExport,
}: PdfExportActionsProps) {
  async function download(mode: "official" | "summary") {
    const response = await fetch(`/api/characters/${characterId}/export?mode=${mode}`);

    if (!response.ok) {
      return;
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${characterId}-${mode}.pdf`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <section className="space-y-2 rounded-radius-sm border border-border-default bg-bg-surface p-3">
      <h3 className="text-sm font-semibold text-fg-primary">{copy.title}</h3>
      <div className="flex flex-wrap gap-2">
        {hasUnsavedChanges ? (
          <>
            <Button density="compact" intent="primary" onClick={onRequestSaveBeforeExport}>
              {copy.saveThenExport}
            </Button>
            <Button density="compact" intent="neutral" onClick={() => void download("summary")}>
              {copy.exportLastSaved}
            </Button>
          </>
        ) : (
          <>
            <Button density="compact" intent="primary" onClick={() => void download("summary")}>
              {copy.summary}
            </Button>
            <Button density="compact" intent="neutral" onClick={() => void download("official")}>
              {copy.official}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
