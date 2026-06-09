import { DbServiceError } from "@/server/errors";

export { DbServiceError };

export class DbQueryError extends DbServiceError {
  constructor(message = "Database query failed.", cause?: unknown) {
    super({
      code: "DB_QUERY_FAILED",
      status: 500,
      exitCode: 3,
      message,
      cause,
    });
  }
}

export class DbTransactionError extends DbServiceError {
  constructor(message = "Database transaction failed.", cause?: unknown) {
    super({
      code: "DB_TRANSACTION_FAILED",
      status: 500,
      exitCode: 3,
      message,
      cause,
    });
  }
}
