"use client";

import { useState } from "react";

import {
  selectDraftEnvelope,
  selectDraftIsDirty,
  selectIsDraftStoreHydrated,
} from "@/client/state/draft-store.selectors";
import { useDraftStore } from "@/client/state/draft-store";
import type { DraftPayload, DraftScope } from "@/client/state/draft-store.types";

const DEMO_SCOPE: DraftScope = "character-create";

type DemoDraftData = DraftPayload & {
  name?: string;
};

function getDraftName(data: DraftPayload | null): string {
  if (!data) {
    return "";
  }

  const typedData = data as DemoDraftData;

  return typeof typedData.name === "string" ? typedData.name : "";
}

export function DraftStoreDemo() {
  const [entityId, setEntityId] = useState("demo-character-1");
  const [name, setName] = useState("");

  const isHydrated = useDraftStore(selectIsDraftStoreHydrated);
  const draftEnvelope = useDraftStore((state) =>
    selectDraftEnvelope(state, DEMO_SCOPE, entityId),
  );
  const isDirty = useDraftStore((state) =>
    selectDraftIsDirty(state, DEMO_SCOPE, entityId),
  );

  const loadDraft = useDraftStore((state) => state.loadDraft);
  const patchDraft = useDraftStore((state) => state.patchDraft);
  const clearDraft = useDraftStore((state) => state.clearDraft);
  const markSaved = useDraftStore((state) => state.markSaved);

  const handleLoadDraft = () => {
    const loaded = loadDraft(DEMO_SCOPE, entityId);
    setName(getDraftName(loaded?.data ?? null));
  };

  const handleClearDraft = () => {
    clearDraft(DEMO_SCOPE, entityId);
    setName("");
  };

  const handleSaveDraft = () => {
    patchDraft(DEMO_SCOPE, entityId, { name }, "save");
  };

  const handleSubmitDraft = () => {
    patchDraft(DEMO_SCOPE, entityId, { name }, "submit");
    markSaved(DEMO_SCOPE, entityId, "submit");
  };

  return (
    <section className="mt-8 rounded-xl border border-zinc-200 p-4">
      <h2 className="text-lg font-semibold text-zinc-900">Draft store demo</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Temporary scaffolding: verifies draft patch/load/clear and action-based
        persistence triggers.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr]">
        <label className="text-sm font-medium text-zinc-700" htmlFor="entity-id">
          Entity id
        </label>
        <input
          id="entity-id"
          value={entityId}
          onChange={(event) => setEntityId(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />

        <label className="text-sm font-medium text-zinc-700" htmlFor="draft-name">
          Character name
        </label>
        <input
          id="draft-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => patchDraft(DEMO_SCOPE, entityId, { name }, "blur")}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleLoadDraft}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          Load draft
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={handleSubmitDraft}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          Submit (mark saved)
        </button>
        <button
          type="button"
          onClick={handleClearDraft}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          Clear draft
        </button>
      </div>

      <dl className="mt-4 grid gap-1 text-xs text-zinc-600">
        <div className="flex gap-2">
          <dt className="font-medium">Hydrated:</dt>
          <dd>{isHydrated ? "yes" : "no"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Dirty:</dt>
          <dd>{isDirty ? "yes" : "no"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Updated at:</dt>
          <dd>{draftEnvelope?.updatedAt ?? "n/a"}</dd>
        </div>
      </dl>
    </section>
  );
}
