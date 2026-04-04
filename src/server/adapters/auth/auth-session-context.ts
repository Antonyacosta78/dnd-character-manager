import { auth } from "@/auth";
import { prisma } from "@/server/adapters/prisma/prisma-client";
import type {
  SessionContext,
  SessionContextPort,
} from "@/server/ports/session-context";
import { headers } from "next/headers";

export class AuthSessionContext implements SessionContextPort {
  async getSessionContext(): Promise<SessionContext> {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = typeof session?.user?.id === "string" ? session.user.id : null;

    if (!userId) {
      return {
        userId: null,
        isAdmin: false,
      };
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    return {
      userId,
      isAdmin: userRecord?.isAdmin === true,
    };
  }
}
