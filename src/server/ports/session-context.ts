export interface SessionContext {
  userId: string | null;
  isAdmin: boolean;
}

export interface SessionContextPort {
  getSessionContext(): Promise<SessionContext>;
}
