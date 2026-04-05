export class AuthUnauthenticatedError extends Error {
  readonly code = "AUTH_UNAUTHENTICATED" as const;

  constructor(message = "Authentication is required.") {
    super(message);
    this.name = "AuthUnauthenticatedError";
  }
}

export class AuthForbiddenError extends Error {
  readonly code = "AUTH_FORBIDDEN" as const;

  constructor(message = "You are not allowed to access this resource.") {
    super(message);
    this.name = "AuthForbiddenError";
  }
}
