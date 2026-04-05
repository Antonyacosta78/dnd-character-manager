import { Alert } from "@/components/ui/alert";
import type { Intent } from "@/lib/design-system/tokens";

import { RuneIcon } from "./rune-icon";

export interface ValidationCalloutProps {
  intent: Intent;
  title: string;
  message: string;
  details?: string[];
  invalidRuneLabel: string;
}

export function ValidationCallout({
  intent,
  title,
  message,
  details,
  invalidRuneLabel,
}: ValidationCalloutProps) {
  return (
    <Alert
      intent={intent}
      heading={
        <span className="inline-flex items-center gap-2">
          <RuneIcon name="rune-invalid-state" label={invalidRuneLabel} className="text-state-danger" />
          <span>{title}</span>
        </span>
      }
      description={message}
      role="alert"
    >
      {details && details.length > 0 ? (
        <ul className="list-disc space-y-1 pl-4 text-xs text-fg-secondary">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </Alert>
  );
}
