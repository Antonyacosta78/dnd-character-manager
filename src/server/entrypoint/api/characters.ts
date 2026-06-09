import { createNotImplementedApiRoute } from "@/server/entrypoint/api/reset-not-implemented";

/** @implements GET /api/characters */
export const GET = createNotImplementedApiRoute(
  "GET /api/characters is not implemented in the current shell-only reset state.",
);
