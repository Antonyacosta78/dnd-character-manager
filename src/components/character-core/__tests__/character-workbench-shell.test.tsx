import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { CharacterWorkbenchShell } from "@/components/character-core/character-workbench-shell";

describe("CharacterWorkbenchShell", () => {
  test("renders shared shell regions and step status markers", () => {
    const markup = renderToStaticMarkup(
      <CharacterWorkbenchShell
        header={<h1>Header</h1>}
        saveState={<span>Saved</span>}
        actions={<button type="button">Action</button>}
        steps={[
          { id: "core", label: "Core", status: "complete", isActive: false, onSelect: () => {} },
          { id: "inventory", label: "Inventory", status: "warning", isActive: true, onSelect: () => {} },
        ]}
        canvas={<div>Canvas</div>}
        pulse={<div>Pulse</div>}
      />,
    );

    expect(markup).toContain("Header");
    expect(markup).toContain("Canvas");
    expect(markup).toContain("Pulse");
    expect(markup).toContain("✓");
    expect(markup).toContain("!");
  });
});
