import { auth } from "@/auth";
import { prisma } from "@/server/adapters/prisma/prisma-client";
import type {
  SessionContext,
  SessionContextPort,
} from "@/server/ports/session-context";
import { headers } from "next/headers";

const SIGNED_OUT_SESSION_CONTEXT: SessionContext = {
  userId: null,
  isAdmin: false,
};

export interface AuthSessionContextDeps {
  getSession?: () => Promise<{ user?: { id?: string | null } | null } | null>;
  findUserIsAdmin?: (userId: string) => Promise<boolean>;
}

export class AuthSessionContext implements SessionContextPort {
  private readonly getSession: NonNullable<AuthSessionContextDeps["getSession"]>;

  private readonly findUserIsAdmin: NonNullable<AuthSessionContextDeps["findUserIsAdmin"]>;

  constructor(deps?: AuthSessionContextDeps) {
    this.getSession = deps?.getSession ?? this.getSessionFromAuth;
    this.findUserIsAdmin = deps?.findUserIsAdmin ?? this.loadIsAdminFromDb;
  }

  async getSessionContext(): Promise<SessionContext> {
    try {
      const session = await this.getSession();
      const userId = typeof session?.user?.id === "string" ? session.user.id : null;

      if (!userId) {
        return SIGNED_OUT_SESSION_CONTEXT;
      }

      const isAdmin = await this.findUserIsAdmin(userId);

      return {
        userId,
        isAdmin,
      };
    } catch {
      return SIGNED_OUT_SESSION_CONTEXT;
    }
  }

  private async getSessionFromAuth() {
    return auth.api.getSession({
      headers: await headers(),
    });
  }

  private async loadIsAdminFromDb(userId: string) {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    return userRecord?.isAdmin === true;
  }
}
