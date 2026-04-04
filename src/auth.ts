import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/server/adapters/prisma/prisma-client";

const betterAuthUrl = process.env.BETTER_AUTH_URL;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: betterAuthUrl,
  trustedOrigins: betterAuthUrl ? [betterAuthUrl] : undefined,
});
