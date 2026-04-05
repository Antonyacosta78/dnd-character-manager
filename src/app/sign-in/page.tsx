import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { SignInForm } from "@/app/sign-in/sign-in-form";

export default async function SignInPage() {
  const t = await getTranslations("common");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-12 font-ui sm:px-8">
      <header className="space-y-2">
        <p className="text-sm text-fg-muted">{t("auth.signIn.eyebrow")}</p>
        <h1 className="font-display text-3xl tracking-tight text-fg-primary">{t("auth.signIn.title")}</h1>
        <p className="text-sm text-fg-secondary">{t("auth.signIn.description")}</p>
      </header>

      <div className="rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
        <SignInForm
          copy={{
            usernameLabel: t("auth.signIn.usernameLabel"),
            passwordLabel: t("auth.signIn.passwordLabel"),
            usernamePlaceholder: t("auth.signIn.usernamePlaceholder"),
            passwordPlaceholder: t("auth.signIn.passwordPlaceholder"),
            submit: t("auth.signIn.submit"),
            pending: t("auth.signIn.pending"),
            error: t("auth.signIn.error"),
          }}
        />
      </div>

      <Link href="/" className="text-sm text-accent-rubric underline-offset-2 hover:underline">
        {t("auth.signIn.backHome")}
      </Link>
    </main>
  );
}
