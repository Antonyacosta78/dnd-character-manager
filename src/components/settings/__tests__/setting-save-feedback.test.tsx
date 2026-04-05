import assert from "node:assert/strict";
import { describe, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SettingSaveFeedback } from "@/components/settings/setting-save-feedback";

const labels = {
  loading: "Saving setting...",
  saved: "Setting saved",
  failed: "Could not save setting",
};

describe("setting-save-feedback", () => {
  it("renders polite live-region status for saved state", () => {
    const html = renderToStaticMarkup(
      <SettingSaveFeedback feedback={{ state: "saved" }} labels={labels} />,
    );

    assert.match(html, /role="status"/);
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /Setting saved/);
    assert.match(html, /✓/);
  });

  it("does not render output for idle state", () => {
    const html = renderToStaticMarkup(
      <SettingSaveFeedback feedback={{ state: "idle" }} labels={labels} />,
    );

    assert.equal(html, "");
  });
});
