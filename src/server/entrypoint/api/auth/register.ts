import { createNotImplementedApiRoute } from "@/server/entrypoint/api/reset-not-implemented";

/** @implements POST /api/auth/register */
export const POST = createNotImplementedApiRoute(
  "POST /api/auth/register is not implemented in the current shell-only reset state.",
);
