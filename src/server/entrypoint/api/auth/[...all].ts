import { createNotImplementedApiRoute } from "@/server/entrypoint/api/reset-not-implemented";

/** @implements GET /api/auth/[...all] */
export const GET = createNotImplementedApiRoute(
  "GET /api/auth/[...all] is not implemented in the current shell-only reset state.",
);

/** @implements POST /api/auth/[...all] */
export const POST = createNotImplementedApiRoute(
  "POST /api/auth/[...all] is not implemented in the current shell-only reset state.",
);
