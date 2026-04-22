"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CharacterWorkbenchShell } from "@/components/character-core/character-workbench-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDraftStore } from "@/client/state/draft-store";

interface ClassOption {
  name: string;
  source: string;
}

interface CharacterBuilderStepOneCopy {
  title: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  conceptLabel: string;
  conceptPlaceholder: string;
  classLabel: string;
  classPlaceholder: string;
  classSourceLabel: string;
  levelLabel: string;
  levelValue: string;
  acknowledgeWarning: string;
  save: string;
  saving: string;
  genericError: string;
  validationError: string;
  warningConceptShort: string;
  loadClassesError: string;
  unsavedDraft: string;
}

interface CharacterBuilderStepOneProps {
  copy: CharacterBuilderStepOneCopy;
}

interface ApiErrorPayload {
  error?: {
    code?: string;
    details?: {
      warnings?: Array<{ code?: string }>;
      hardIssues?: Array<{ path?: string; message?: string }>;
      unacknowledgedWarningCodes?: string[];
    };
  };
}

const DRAFT_SCOPE = "character-create" as const;
const DRAFT_ENTITY_ID = "new-character";
const BUILDER_STEP_FORM_ID = "character-builder-step-one-form";

export function CharacterBuilderStepOne({ copy }: CharacterBuilderStepOneProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [concept, setConcept] = useState("");
  const [className, setClassName] = useState("");
  const [classSource, setClassSource] = useState("");
  const [acknowledgeWarning, setAcknowledgeWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [classOptionsError, setClassOptionsError] = useState<string | null>(null);

  const draftEnvelope = useDraftStore((state) => state.byScope[DRAFT_SCOPE][DRAFT_ENTITY_ID] ?? null);
  const loadDraft = useDraftStore((state) => state.loadDraft);
  const patchDraft = useDraftStore((state) => state.patchDraft);
  const markSaved = useDraftStore((state) => state.markSaved);
  const setBaseRevision = useDraftStore((state) => state.setBaseRevision);
  const clearDraft = useDraftStore((state) => state.clearDraft);

  const hasConceptWarning = useMemo(() => concept.trim().length > 0 && concept.trim().length < 10, [concept]);

  useEffect(() => {
    const loaded = loadDraft<{ name?: string; concept?: string; className?: string; classSource?: string }>(
      DRAFT_SCOPE,
      DRAFT_ENTITY_ID,
    );

    if (!loaded) {
      return;
    }

    setName(typeof loaded.data.name === "string" ? loaded.data.name : "");
    setConcept(typeof loaded.data.concept === "string" ? loaded.data.concept : "");
    setClassName(typeof loaded.data.className === "string" ? loaded.data.className : "");
    setClassSource(typeof loaded.data.classSource === "string" ? loaded.data.classSource : "");
  }, [loadDraft]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/rules/classes", { method: "GET" });

        if (!response.ok) {
          setClassOptionsError(copy.loadClassesError);
          return;
        }

        const payload = (await response.json()) as {
          data?: {
            items?: Array<{ name: string; source: string }>;
          };
        };

        const items = payload.data?.items ?? [];
        setClassOptions(items);

        if (!className && items.length > 0) {
          setClassName(items[0]?.name ?? "");
          setClassSource(items[0]?.source ?? "");
        }
      } catch {
        setClassOptionsError(copy.loadClassesError);
      }
    })();
  }, [className, copy.loadClassesError]);

  useEffect(() => {
    patchDraft(
      DRAFT_SCOPE,
      DRAFT_ENTITY_ID,
      {
        name,
        concept,
        className,
        classSource,
      },
      "blur",
    );
  }, [className, classSource, concept, name, patchDraft]);

  return (
    <CharacterWorkbenchShell
      header={
        <>
          <h1 className="text-xl font-semibold text-fg-primary">{copy.title}</h1>
          <p className="text-sm text-fg-secondary">{copy.description}</p>
        </>
      }
      saveState={<>{draftEnvelope?.isDirty ? copy.unsavedDraft : copy.levelValue}</>}
      actions={(
        <Button
          type="submit"
          form={BUILDER_STEP_FORM_ID}
          intent="primary"
          density="compact"
          disabled={isSubmitting || (hasConceptWarning && !acknowledgeWarning)}
        >
          {isSubmitting ? copy.saving : copy.save}
        </Button>
      )}
      steps={[
        {
          id: "step-one",
          label: copy.title,
          status: hasConceptWarning && !acknowledgeWarning ? "warning" : "idle",
          isActive: true,
          onSelect: () => {},
        },
      ]}
      pulse={(
        <div className="space-y-2 text-sm text-fg-primary">
          <p>
            {copy.classLabel}: {className || copy.classPlaceholder}
          </p>
          <p>{copy.levelValue}</p>
        </div>
      )}
      canvas={(
        <form
          id={BUILDER_STEP_FORM_ID}
          className="space-y-4 rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft"
          onSubmit={async (event) => {
          event.preventDefault();
          setFeedback(null);
          setIsSubmitting(true);

          const acknowledgedWarningCodes = hasConceptWarning && acknowledgeWarning
            ? ["CHARACTER_CORE_WARNING_CONCEPT_SHORT"]
            : [];

          try {
            const response = await fetch("/api/characters", {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({
                draft: {
                  name,
                  concept,
                  classRef: {
                    name: className,
                    source: classSource,
                  },
                  level: 1,
                },
                acknowledgedWarningCodes,
              }),
            });

            if (!response.ok) {
              const payload = await parseErrorPayload(response);
              setFeedback(resolveErrorMessage(payload, copy));
              setIsSubmitting(false);
              return;
            }

            const payload = (await response.json()) as {
              data: {
                character: {
                  id: string;
                  revision: number;
                };
              };
            };

            patchDraft(
              DRAFT_SCOPE,
              payload.data.character.id,
              {
                name,
                concept,
                className,
                classSource,
              },
              "submit",
            );
            markSaved(DRAFT_SCOPE, payload.data.character.id, "submit");
            setBaseRevision(DRAFT_SCOPE, payload.data.character.id, payload.data.character.revision, "submit");
            clearDraft(DRAFT_SCOPE, DRAFT_ENTITY_ID);
            router.push(`/characters/${payload.data.character.id}`);
            router.refresh();
          } catch {
            setFeedback(copy.genericError);
          } finally {
            setIsSubmitting(false);
          }
          }}
        >
          <div className="space-y-2">
            <label htmlFor="character-name" className="text-sm font-medium text-fg-primary">
              {copy.nameLabel}
            </label>
            <Input
              id="character-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={copy.namePlaceholder}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="character-concept" className="text-sm font-medium text-fg-primary">
              {copy.conceptLabel}
            </label>
            <textarea
              id="character-concept"
              name="concept"
              className="min-h-28 w-full rounded-radius-sm border border-border-default bg-bg-elevated px-3 py-2 text-sm text-fg-primary shadow-shadow-soft placeholder:text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-rubric focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas"
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              placeholder={copy.conceptPlaceholder}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="character-class" className="text-sm font-medium text-fg-primary">
              {copy.classLabel}
            </label>
            <select
              id="character-class"
              name="class"
              value={className && classSource ? `${className}::${classSource}` : ""}
              onChange={(event) => {
                const [nextName, nextSource] = event.target.value.split("::");
                setClassName(nextName ?? "");
                setClassSource(nextSource ?? "");
              }}
              className="min-h-10 w-full rounded-radius-sm border border-border-default bg-bg-elevated px-3 py-2 text-sm text-fg-primary shadow-shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-rubric focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas"
              disabled={classOptions.length === 0}
              required
            >
              <option value="">{copy.classPlaceholder}</option>
              {classOptions.map((option) => (
                <option key={`${option.name}:${option.source}`} value={`${option.name}::${option.source}`}>
                  {option.name} ({option.source})
                </option>
              ))}
            </select>
            <p className="text-xs text-fg-muted">
              {copy.classSourceLabel}: {classSource}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-fg-primary">{copy.levelLabel}</p>
            <p className="text-sm text-fg-secondary">{copy.levelValue}</p>
          </div>

          {hasConceptWarning ? (
            <div className="space-y-2 rounded-radius-sm border border-border-default bg-bg-muted p-3">
              <p className="text-sm text-fg-secondary">{copy.warningConceptShort}</p>
              <label className="flex items-start gap-2 text-sm text-fg-primary">
                <input
                  type="checkbox"
                  checked={acknowledgeWarning}
                  onChange={(event) => setAcknowledgeWarning(event.target.checked)}
                  className="mt-0.5"
                />
                <span>{copy.acknowledgeWarning}</span>
              </label>
            </div>
          ) : null}

          {classOptionsError ? <Alert intent="danger" description={classOptionsError} /> : null}
          {feedback ? <Alert intent="danger" description={feedback} /> : null}

          {draftEnvelope?.isDirty ? (
            <p className="text-xs text-fg-muted">{copy.unsavedDraft}</p>
          ) : null}
        </form>
      )}
    />
  );
}

async function parseErrorPayload(response: Response): Promise<ApiErrorPayload | null> {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return null;
  }
}

function resolveErrorMessage(payload: ApiErrorPayload | null, copy: CharacterBuilderStepOneCopy): string {
  if (!payload?.error) {
    return copy.genericError;
  }

  if (payload.error.code === "REQUEST_VALIDATION_FAILED") {
    const warningCodes = payload.error.details?.unacknowledgedWarningCodes ?? [];

    if (warningCodes.includes("CHARACTER_CORE_WARNING_CONCEPT_SHORT")) {
      return copy.warningConceptShort;
    }

    return copy.validationError;
  }

  return copy.genericError;
}
