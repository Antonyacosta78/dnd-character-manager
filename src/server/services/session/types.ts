export interface SessionContext {
  userId: string | null;
  isAdmin: boolean;
}

export interface SessionUser {
  id?: string | null;
}

export interface ProviderSession {
  user?: SessionUser | null;
}

export interface RegisterAccountInput {
  username: string;
  password: string;
  email: string;
}

export interface RegisterAccountResult {
  setCookieHeaders: string[];
}
