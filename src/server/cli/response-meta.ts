import { randomUUID } from "node:crypto";

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

export function createResponseMeta(): ResponseMeta {
  return {
    requestId: `req_${randomUUID()}`,
    timestamp: new Date().toISOString(),
  };
}
