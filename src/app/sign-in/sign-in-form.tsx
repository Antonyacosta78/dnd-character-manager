import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="sign-in-username" className="text-sm font-medium text-fg-primary">
          {copy.usernameLabel}
        </label>
        <Input id="sign-in-username" name="username" placeholder={copy.usernamePlaceholder} autoComplete="username" disabled />
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
          disabled
        />
      </div>

      <Button type="button" intent="primary" className="w-full" disabled>
        {copy.submit}
      </Button>
    </form>
  );
}
