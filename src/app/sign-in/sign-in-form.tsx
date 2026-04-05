"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export interface SignInFormCopy {
  usernameLabel: string;
  passwordLabel: string;
  usernamePlaceholder: string;
  passwordPlaceholder: string;
  submit: string;
  pending: string;
  error: string;
}

export function SignInForm({ copy }: { copy: SignInFormCopy }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsPending(true);
        setHasError(false);

        const formData = new FormData(event.currentTarget);
        const username = formData.get("username");
        const password = formData.get("password");

        if (typeof username !== "string" || typeof password !== "string") {
          setHasError(true);
          setIsPending(false);
          return;
        }

        const result = await authClient.signIn.username({
          username,
          password,
          callbackURL: "/characters",
        });

        if (result.error) {
          setHasError(true);
          setIsPending(false);
          return;
        }

        router.push("/characters");
        router.refresh();
      }}
    >
      <div className="space-y-2">
        <label htmlFor="sign-in-username" className="text-sm font-medium text-fg-primary">
          {copy.usernameLabel}
        </label>
        <Input id="sign-in-username" name="username" placeholder={copy.usernamePlaceholder} autoComplete="username" required />
      </div>

      <div className="space-y-2">
        <label htmlFor="sign-in-password" className="text-sm font-medium text-fg-primary">
          {copy.passwordLabel}
        </label>
        <Input
          id="sign-in-password"
          name="password"
          type="password"
          placeholder={copy.passwordPlaceholder}
          autoComplete="current-password"
          required
        />
      </div>

      {hasError ? <Alert intent="danger" description={copy.error} /> : null}

      <Button type="submit" intent="primary" className="w-full" disabled={isPending}>
        {isPending ? copy.pending : copy.submit}
      </Button>
    </form>
  );
}
