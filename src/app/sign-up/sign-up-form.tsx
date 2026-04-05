"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RegisterApiError {
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
}

export function SignUpForm({ copy }: { copy: SignUpFormCopy }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{ intent: "danger" | "neutral"; message: string } | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setIsPending(true);
        setFeedback(null);

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
          setIsPending(false);
          return;
        }

        if (password !== confirmPassword) {
          setFeedback({ intent: "danger", message: copy.passwordMismatchError });
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

          setFeedback({
            intent: "danger",
            message: resolveErrorMessage(payload, copy),
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

      {feedback ? <Alert intent={feedback.intent} description={feedback.message} /> : null}

      <Button type="submit" intent="primary" className="w-full" disabled={isPending}>
        {isPending ? copy.pending : copy.submit}
      </Button>
    </form>
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
