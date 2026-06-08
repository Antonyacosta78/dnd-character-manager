import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  passwordInvalidError: string;
  passwordMismatchError: string;
  emailRequiredError: string;
  emailInvalidError: string;
}

export function SignUpForm({ copy }: { copy: SignUpFormCopy }) {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="sign-up-username" className="text-sm font-medium text-fg-primary">
          {copy.usernameLabel}
        </label>
        <Input id="sign-up-username" name="username" placeholder={copy.usernamePlaceholder} autoComplete="username" disabled />
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
          disabled
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
          disabled
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="sign-up-email" className="text-sm font-medium text-fg-primary">
          {copy.emailLabel}
        </label>
        <Input id="sign-up-email" name="email" type="email" placeholder={copy.emailPlaceholder} autoComplete="email" disabled />
      </div>

      <Button type="button" intent="primary" className="w-full" disabled>
        {copy.submit}
      </Button>
    </form>
  );
}
