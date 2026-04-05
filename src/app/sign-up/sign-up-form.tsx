"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const BUG_REPORT_NOTES_MAX_LENGTH = 750;

interface RegisterApiError {
  meta?: {
    requestId?: string;
  };
  error?: {
    code?: string;
    details?: {
      fields?: Partial<Record<"username" | "password" | "email" | "body", string[]>>;
    };
  };
}

export interface SignUpFormCopy {
  usernameLabel: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  emailLabel: string;
  usernamePlaceholder: string;
  passwordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  emailPlaceholder: string;
  submit: string;
  pending: string;
  genericError: string;
  payloadError: string;
  usernameRequiredError: string;
  usernameDuplicateError: string;
  passwordRequiredError: string;
  passwordMismatchError: string;
  emailInvalidError: string;
  failureRequestIdLabel: string;
  reportIssue: string;
  reportIssueTitle: string;
  reportIssueDescription: string;
  reportIssueTimestampLabel: string;
  reportIssueRouteLabel: string;
  reportIssueRequestIdLabel: string;
  reportIssueNotesLabel: string;
  reportIssueNotesHint: string;
  reportIssuePrivacyHint: string;
  reportIssueSubmit: string;
  reportIssueSubmitting: string;
  reportIssueSuccess: string;
  reportIssueFailure: string;
}

interface FailureContext {
  requestId?: string;
  route: string;
}

export function SignUpForm({ copy }: { copy: SignUpFormCopy }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{ intent: "danger" | "neutral"; message: string } | null>(null);
  const [failureContext, setFailureContext] = useState<FailureContext | null>(null);
  const [showBugReportForm, setShowBugReportForm] = useState(false);
  const [bugNotes, setBugNotes] = useState("");
  const [bugReportState, setBugReportState] = useState<"idle" | "submitting" | "success" | "error">("idle");

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setIsPending(true);
        setFeedback(null);
        setFailureContext(null);
        setShowBugReportForm(false);
        setBugReportState("idle");

        const formData = new FormData(form);
        const username = formData.get("username");
        const password = formData.get("password");
        const confirmPassword = formData.get("confirmPassword");
        const email = formData.get("email");

        if (
          typeof username !== "string" ||
          typeof password !== "string" ||
          typeof confirmPassword !== "string" ||
          typeof email !== "string"
        ) {
          setFeedback({ intent: "danger", message: copy.payloadError });
          setFailureContext({
            route: pathname || "/sign-up",
          });
          setIsPending(false);
          return;
        }

        if (password !== confirmPassword) {
          setFeedback({ intent: "danger", message: copy.passwordMismatchError });
          setFailureContext({
            route: pathname || "/sign-up",
          });
          setIsPending(false);
          return;
        }

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
            email,
          }),
        });

        if (!response.ok) {
          const payload = (await parseErrorPayload(response)) ?? {};
          const requestId = payload.meta?.requestId || response.headers.get("x-request-id") || undefined;

          setFeedback({
            intent: "danger",
            message: resolveErrorMessage(payload, copy),
          });
          setFailureContext({
            requestId,
            route: pathname || "/sign-up",
          });
          setIsPending(false);
          return;
        }

        router.push("/characters");
        router.refresh();
      }}
    >
      <div className="space-y-2">
        <label htmlFor="sign-up-username" className="text-sm font-medium text-fg-primary">
          {copy.usernameLabel}
        </label>
        <Input id="sign-up-username" name="username" placeholder={copy.usernamePlaceholder} autoComplete="username" required />
      </div>

      <div className="space-y-2">
        <label htmlFor="sign-up-password" className="text-sm font-medium text-fg-primary">
          {copy.passwordLabel}
        </label>
        <Input
          id="sign-up-password"
          name="password"
          type="password"
          placeholder={copy.passwordPlaceholder}
          autoComplete="new-password"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="sign-up-confirm-password" className="text-sm font-medium text-fg-primary">
          {copy.confirmPasswordLabel}
        </label>
        <Input
          id="sign-up-confirm-password"
          name="confirmPassword"
          type="password"
          placeholder={copy.confirmPasswordPlaceholder}
          autoComplete="new-password"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="sign-up-email" className="text-sm font-medium text-fg-primary">
          {copy.emailLabel}
        </label>
        <Input id="sign-up-email" name="email" type="email" placeholder={copy.emailPlaceholder} autoComplete="email" />
      </div>

      {feedback ? (
        <Alert intent={feedback.intent} description={feedback.message}>
          {failureContext?.requestId ? (
            <p className="text-xs text-fg-muted">
              {copy.failureRequestIdLabel}: <span className="select-all font-mono">{failureContext.requestId}</span>
            </p>
          ) : null}

          {feedback.intent === "danger" ? (
            <div className="mt-3 space-y-3">
              <Button
                type="button"
                intent="ghost"
                className="w-full"
                onClick={() => {
                  setShowBugReportForm((current) => !current);
                  setBugReportState("idle");
                }}
              >
                {copy.reportIssue}
              </Button>

              {showBugReportForm && failureContext ? (
                <BugReportForm
                  copy={copy}
                  failureContext={failureContext}
                  notes={bugNotes}
                  bugReportState={bugReportState}
                  onNotesChange={setBugNotes}
                  onStateChange={setBugReportState}
                />
              ) : null}
            </div>
          ) : null}
        </Alert>
      ) : null}

      <Button type="submit" intent="primary" className="w-full" disabled={isPending}>
        {isPending ? copy.pending : copy.submit}
      </Button>
    </form>
  );
}

function BugReportForm({
  copy,
  failureContext,
  notes,
  bugReportState,
  onNotesChange,
  onStateChange,
}: {
  copy: SignUpFormCopy;
  failureContext: FailureContext;
  notes: string;
  bugReportState: "idle" | "submitting" | "success" | "error";
  onNotesChange: (value: string) => void;
  onStateChange: (state: "idle" | "submitting" | "success" | "error") => void;
}) {
  const timestamp = new Date().toISOString();
  const requestId = failureContext.requestId;
  const isSubmitting = bugReportState === "submitting";

  return (
    <div className="space-y-3 rounded-radius-sm border border-border-default bg-bg-elevated p-3">
      <div>
        <p className="text-sm font-medium text-fg-primary">{copy.reportIssueTitle}</p>
        <p className="mt-1 text-xs text-fg-secondary">{copy.reportIssueDescription}</p>
      </div>

      <dl className="space-y-1 text-xs text-fg-muted">
        <div className="flex justify-between gap-2">
          <dt>{copy.reportIssueTimestampLabel}</dt>
          <dd className="font-mono text-right">{timestamp}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{copy.reportIssueRouteLabel}</dt>
          <dd className="font-mono text-right">{failureContext.route}</dd>
        </div>
        {requestId ? (
          <div className="flex justify-between gap-2">
            <dt>{copy.reportIssueRequestIdLabel}</dt>
            <dd className="select-all font-mono text-right">{requestId}</dd>
          </div>
        ) : null}
      </dl>

      <div className="space-y-2">
        <label htmlFor="bug-report-notes" className="text-xs font-medium text-fg-primary">
          {copy.reportIssueNotesLabel}
        </label>
        <Textarea
          id="bug-report-notes"
          maxLength={BUG_REPORT_NOTES_MAX_LENGTH}
          value={notes}
          onChange={(event) => {
            onNotesChange(event.currentTarget.value);
            if (bugReportState !== "idle") {
              onStateChange("idle");
            }
          }}
        />
        <p className="text-xs text-fg-muted">
          {copy.reportIssueNotesHint} ({notes.length}/{BUG_REPORT_NOTES_MAX_LENGTH})
        </p>
      </div>

      <p className="text-xs text-fg-muted">{copy.reportIssuePrivacyHint}</p>

      {bugReportState === "success" ? <Alert intent="neutral" description={copy.reportIssueSuccess} /> : null}
      {bugReportState === "error" ? <Alert intent="danger" description={copy.reportIssueFailure} /> : null}

      <Button
        type="button"
        intent="primary"
        className="w-full"
        disabled={isSubmitting}
        onClick={async () => {
          onStateChange("submitting");

          try {
            const response = await fetch("/api/bug-report", {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({
                timestamp,
                route: failureContext.route,
                requestId,
                notes,
              }),
            });

            onStateChange(response.ok ? "success" : "error");
          } catch {
            onStateChange("error");
          }
        }}
      >
        {isSubmitting ? copy.reportIssueSubmitting : copy.reportIssueSubmit}
      </Button>
    </div>
  );
}

async function parseErrorPayload(response: Response): Promise<RegisterApiError | null> {
  try {
    return (await response.json()) as RegisterApiError;
  } catch {
    return null;
  }
}

function resolveErrorMessage(payload: RegisterApiError, copy: SignUpFormCopy): string {
  if (payload.error?.code !== "REQUEST_VALIDATION_FAILED") {
    return copy.genericError;
  }

  const fieldIssues = payload.error.details?.fields;

  if (fieldIssues?.body?.includes("invalidPayload")) {
    return copy.payloadError;
  }

  if (fieldIssues?.username?.includes("duplicate")) {
    return copy.usernameDuplicateError;
  }

  if (fieldIssues?.username?.some((issue) => issue === "required" || issue === "invalidType" || issue === "invalidFormat")) {
    return copy.usernameRequiredError;
  }

  if (fieldIssues?.password?.some((issue) => issue === "required" || issue === "invalidType" || issue === "invalidFormat")) {
    return copy.passwordRequiredError;
  }

  if (fieldIssues?.email?.some((issue) => issue === "invalidType" || issue === "invalidFormat")) {
    return copy.emailInvalidError;
  }

  return copy.genericError;
}
