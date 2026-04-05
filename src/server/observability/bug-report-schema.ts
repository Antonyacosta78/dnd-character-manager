import { isValidRequestId } from "@/server/observability/request-id";

export interface BugReportPayload {
  timestamp: string;
  route: string;
  requestId?: string;
  notes?: string;
}

export type BugReportField = "timestamp" | "route" | "requestId" | "notes" | "body";
export type BugReportValidationIssue =
  | "required"
  | "invalidType"
  | "invalidFormat"
  | "invalidPayload"
  | "maxLength";

export type BugReportValidationFields = Partial<Record<BugReportField, BugReportValidationIssue[]>>;

const MAX_NOTES_LENGTH = 750;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

export function sanitizeBugReportNotes(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

export function validateBugReportPayload(body: unknown):
  | {
      ok: true;
      value: BugReportPayload;
    }
  | {
      ok: false;
      fields: BugReportValidationFields;
    } {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      fields: {
        body: ["invalidPayload"],
      },
    };
  }

  const fields: BugReportValidationFields = {};
  const rawTimestamp = body.timestamp;
  const rawRoute = body.route;
  const rawRequestId = body.requestId;
  const rawNotes = body.notes;

  if (typeof rawTimestamp !== "string") {
    fields.timestamp = ["required"];
  }

  if (typeof rawRoute !== "string") {
    fields.route = ["required"];
  }

  if (rawRequestId !== undefined && rawRequestId !== null && typeof rawRequestId !== "string") {
    fields.requestId = ["invalidType"];
  }

  if (rawNotes !== undefined && rawNotes !== null && typeof rawNotes !== "string") {
    fields.notes = ["invalidType"];
  }

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      fields,
    };
  }

  const timestamp = (rawTimestamp as string).trim();
  const route = (rawRoute as string).trim();
  const requestId = typeof rawRequestId === "string" ? rawRequestId.trim() : undefined;
  const notes = typeof rawNotes === "string" ? sanitizeBugReportNotes(rawNotes) : undefined;

  if (!isIsoTimestamp(timestamp)) {
    fields.timestamp = ["invalidFormat"];
  }

  if (!route || !route.startsWith("/")) {
    fields.route = ["invalidFormat"];
  }

  if (requestId && !isValidRequestId(requestId)) {
    fields.requestId = ["invalidFormat"];
  }

  if (notes && notes.length > MAX_NOTES_LENGTH) {
    fields.notes = ["maxLength"];
  }

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      fields,
    };
  }

  return {
    ok: true,
    value: {
      timestamp,
      route,
      requestId: requestId || undefined,
      notes: notes || undefined,
    },
  };
}

export const BUG_REPORT_NOTES_MAX_LENGTH = MAX_NOTES_LENGTH;
