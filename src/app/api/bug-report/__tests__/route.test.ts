import assert from "node:assert/strict";
import { afterEach, describe, it } from "bun:test";

import { createBugReportPostRoute } from "@/app/api/bug-report/route";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("POST /api/bug-report", () => {
  it("accepts valid payloads with optional requestId and notes", async () => {
    process.env.OBSERVABILITY_ENABLED = "true";

    const postRoute = createBugReportPostRoute({
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_bug_report",
    });

    const response = await postRoute(
      new Request("https://example.test/api/bug-report", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          timestamp: "2026-04-05T12:00:00.000Z",
          route: "/sign-up",
          requestId: "req_failed_signup",
          notes: "Could not create account",
        }),
      }),
    );

    const payload = await response.json();

    assert.equal(response.status, 202);
    assert.equal(response.headers.get("x-request-id"), "req_bug_report");
    assert.equal(payload.data.accepted, true);
    assert.equal(payload.meta.requestId, "req_bug_report");
  });

  it("rejects invalid payloads with REQUEST_VALIDATION_FAILED", async () => {
    const postRoute = createBugReportPostRoute({
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_bug_report_invalid",
    });

    const response = await postRoute(
      new Request("https://example.test/api/bug-report", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          route: "sign-up",
          notes: "x".repeat(751),
        }),
      }),
    );

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "REQUEST_VALIDATION_FAILED");
    assert.equal(payload.error.status, 400);
    assert.deepEqual(payload.error.details.fields.timestamp, ["required"]);
  });

  it("enforces notes max length at 750 characters", async () => {
    const postRoute = createBugReportPostRoute({
      now: () => new Date("2026-04-05T12:00:00.000Z"),
      createRequestId: () => "req_bug_report_notes",
    });

    const response = await postRoute(
      new Request("https://example.test/api/bug-report", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          timestamp: "2026-04-05T12:00:00.000Z",
          route: "/sign-up",
          notes: "x".repeat(751),
        }),
      }),
    );

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "REQUEST_VALIDATION_FAILED");
    assert.deepEqual(payload.error.details.fields.notes, ["maxLength"]);
  });

  it("does not include notes text in bug-report operational logs", async () => {
    process.env.OBSERVABILITY_ENABLED = "true";

    const calls: string[] = [];
    const originalInfo = console.info;
    console.info = (message?: unknown) => {
      calls.push(String(message ?? ""));
    };

    try {
      const postRoute = createBugReportPostRoute({
        now: () => new Date("2026-04-05T12:00:00.000Z"),
        createRequestId: () => "req_bug_report_logs",
      });

      await postRoute(
        new Request("https://example.test/api/bug-report", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            timestamp: "2026-04-05T12:00:00.000Z",
            route: "/sign-up",
            notes: "token=secret-value",
          }),
        }),
      );
    } finally {
      console.info = originalInfo;
    }

    assert.equal(calls.length, 1);
    assert.equal(calls[0].includes("token=secret-value"), false);
    assert.equal(calls[0].includes('"hasNotes":true'), true);
  });
});
