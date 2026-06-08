import { headers as nextHeaders } from "next/headers";

import { auth } from "@/auth";
import { DBService } from "@/server/services/db";
import {
  SessionProviderUnavailableError,
  SessionResolutionError,
} from "@/server/services/session/errors";
import type {
  ProviderSession,
  RegisterAccountInput,
  RegisterAccountResult,
  SessionContext,
} from "@/server/services/session/types";

const SIGNED_OUT_SESSION_CONTEXT: SessionContext = {
  userId: null,
  isAdmin: false,
};

type AuthApi = Record<string, unknown>;

export interface SessionServiceDeps {
  getSession?: (requestHeaders: Headers) => Promise<ProviderSession | null>;
  getCurrentHeaders?: () => Promise<Headers>;
  getUserIsAdmin?: (userId: string) => Promise<boolean>;
  getAuthApi?: () => AuthApi;
}

export class SessionServiceClass {
  private readonly requestContextStore = new WeakMap<Request, SessionContext>();

  private readonly getSession: NonNullable<SessionServiceDeps["getSession"]>;
  private readonly getCurrentHeaders: NonNullable<SessionServiceDeps["getCurrentHeaders"]>;
  private readonly getUserIsAdmin: NonNullable<SessionServiceDeps["getUserIsAdmin"]>;
  private readonly getAuthApi: NonNullable<SessionServiceDeps["getAuthApi"]>;

  constructor(deps: SessionServiceDeps = {}) {
    this.getSession = deps.getSession ?? defaultGetSession;
    this.getCurrentHeaders = deps.getCurrentHeaders ?? nextHeaders;
    this.getUserIsAdmin = deps.getUserIsAdmin ?? ((userId) => DBService.users.isAdmin(userId));
    this.getAuthApi = deps.getAuthApi ?? (() => auth.api as AuthApi);
  }

  bindRequestSessionContext(request: Request, sessionContext: SessionContext): void {
    this.requestContextStore.set(request, sessionContext);
  }

  getBoundRequestSessionContext(request: Request): SessionContext | undefined {
    return this.requestContextStore.get(request);
  }

  async getSessionContextFromRequest(request: Request): Promise<SessionContext> {
    const bound = this.getBoundRequestSessionContext(request);

    if (bound) {
      return bound;
    }

    const sessionContext = await this.getSessionContextFromHeaders(request.headers);
    this.bindRequestSessionContext(request, sessionContext);

    return sessionContext;
  }

  async getCurrentSessionContext(): Promise<SessionContext> {
    const requestHeaders = await this.getCurrentHeaders();
    return this.getSessionContextFromHeaders(requestHeaders);
  }

  async getSessionContextFromHeaders(requestHeaders: Headers): Promise<SessionContext> {
    let session: ProviderSession | null;

    try {
      session = await this.getSession(requestHeaders);
    } catch (error) {
      throw new SessionResolutionError(undefined, error);
    }

    const userId = typeof session?.user?.id === "string" ? session.user.id : null;

    if (!userId) {
      return SIGNED_OUT_SESSION_CONTEXT;
    }

    try {
      const isAdmin = await this.getUserIsAdmin(userId);

      return {
        userId,
        isAdmin,
      };
    } catch (error) {
      throw new SessionResolutionError("Failed to resolve caller access context.", error);
    }
  }

  async registerAccount(
    input: RegisterAccountInput,
    requestHeaders: Headers,
  ): Promise<RegisterAccountResult> {
    const authApi = this.getAuthApi();
    const signUpUsername = authApi.signUpUsername;
    const signUpEmail = authApi.signUpEmail;

    if (typeof signUpUsername === "function") {
      const result = await signUpUsername({
        asResponse: true,
        body: {
          username: input.username,
          password: input.password,
          email: input.email,
          name: input.username,
        },
        headers: requestHeaders,
      });

      assertAuthResultSucceeded(result);
      return this.createSessionAfterRegistration(authApi, input, requestHeaders);
    }

    if (typeof signUpEmail === "function") {
      const result = await signUpEmail({
        asResponse: true,
        body: {
          email: input.email,
          password: input.password,
          username: input.username,
          name: input.username,
        },
        headers: requestHeaders,
      });

      assertAuthResultSucceeded(result);
      return this.createSessionAfterRegistration(authApi, input, requestHeaders);
    }

    throw new SessionProviderUnavailableError(
      "Auth provider registration API is unavailable.",
    );
  }

  private async createSessionAfterRegistration(
    authApi: AuthApi,
    input: RegisterAccountInput,
    requestHeaders: Headers,
  ): Promise<RegisterAccountResult> {
    const signInUsername = authApi.signInUsername;
    const signInEmail = authApi.signInEmail;

    if (typeof signInUsername === "function") {
      const result = await signInUsername({
        asResponse: true,
        body: {
          username: input.username,
          password: input.password,
        },
        headers: requestHeaders,
      });

      return resolveSessionCreationResult(result);
    }

    if (typeof signInEmail === "function") {
      const result = await signInEmail({
        asResponse: true,
        body: {
          email: input.email,
          password: input.password,
        },
        headers: requestHeaders,
      });

      return resolveSessionCreationResult(result);
    }

    throw new SessionProviderUnavailableError(
      "Auth provider sign-in API is unavailable.",
    );
  }
}

async function defaultGetSession(requestHeaders: Headers): Promise<ProviderSession | null> {
  return auth.api.getSession({
    headers: requestHeaders,
  });
}

function resolveSessionCreationResult(result: unknown): RegisterAccountResult {
  assertAuthResultSucceeded(result);

  if (result instanceof Response) {
    return {
      setCookieHeaders: getSetCookieHeaders(result),
    };
  }

  return {
    setCookieHeaders: [],
  };
}

function getSetCookieHeaders(response: Response): string[] {
  const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };

  if (typeof responseHeaders.getSetCookie === "function") {
    return responseHeaders.getSetCookie().filter((value) => value.length > 0);
  }

  const singleSetCookieHeader = response.headers.get("set-cookie");

  if (!singleSetCookieHeader) {
    return [];
  }

  return [singleSetCookieHeader];
}

function assertAuthResultSucceeded(result: unknown): void {
  if (!result || typeof result !== "object") {
    return;
  }

  if (result instanceof Response) {
    if (!result.ok) {
      throw new SessionResolutionError(
        `Auth provider request failed with status ${result.status}.`,
      );
    }

    return;
  }

  const maybeResult = result as { error?: unknown };

  if (maybeResult.error) {
    throw maybeResult.error;
  }
}

export const SessionService = new SessionServiceClass();

export { SIGNED_OUT_SESSION_CONTEXT };
export type { RegisterAccountInput, RegisterAccountResult, SessionContext };
