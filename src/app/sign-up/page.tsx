import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { SignUpForm } from "@/app/sign-up/sign-up-form";

export default async function SignUpPage() {
  const t = await getTranslations("common");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-12 font-ui sm:px-8">
      <header className="space-y-2">
        <p className="text-sm text-fg-muted">{t("auth.signUp.eyebrow")}</p>
        <h1 className="font-display text-3xl tracking-tight text-fg-primary">{t("auth.signUp.title")}</h1>
        <p className="text-sm text-fg-secondary">{t("auth.signUp.description")}</p>
      </header>

      <div className="rounded-radius-sm border border-border-default bg-bg-surface p-4 shadow-shadow-soft">
        <SignUpForm
          copy={{
            usernameLabel: t("auth.signUp.usernameLabel"),
            passwordLabel: t("auth.signUp.passwordLabel"),
            confirmPasswordLabel: t("auth.signUp.confirmPasswordLabel"),
            emailLabel: t("auth.signUp.emailLabel"),
            usernamePlaceholder: t("auth.signUp.usernamePlaceholder"),
            passwordPlaceholder: t("auth.signUp.passwordPlaceholder"),
            confirmPasswordPlaceholder: t("auth.signUp.confirmPasswordPlaceholder"),
            emailPlaceholder: t("auth.signUp.emailPlaceholder"),
            submit: t("auth.signUp.submit"),
            pending: t("auth.signUp.pending"),
            genericError: t("auth.signUp.errors.generic"),
            payloadError: t("auth.signUp.errors.payload"),
            usernameRequiredError: t("auth.signUp.errors.usernameRequired"),
            usernameDuplicateError: t("auth.signUp.errors.usernameDuplicate"),
            passwordRequiredError: t("auth.signUp.errors.passwordRequired"),
            passwordInvalidError: t("auth.signUp.errors.passwordInvalid"),
            passwordMismatchError: t("auth.signUp.errors.passwordMismatch"),
            emailRequiredError: t("auth.signUp.errors.emailRequired"),
            emailInvalidError: t("auth.signUp.errors.emailInvalid"),
          }}
        />
      </div>

      <Link href="/sign-in" className="text-sm text-accent-rubric underline-offset-2 hover:underline">
        {t("auth.signUp.signInCta")}
      </Link>

      <Link href="/" className="text-sm text-accent-rubric underline-offset-2 hover:underline">
        {t("auth.signUp.backHome")}
      </Link>
    </main>
  );
}
