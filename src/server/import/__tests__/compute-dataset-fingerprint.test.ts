import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { computeDatasetFingerprint } from "@/server/import/fingerprint/compute-dataset-fingerprint";

async function writeTestFile(
  rootPath: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const absolutePath = path.join(rootPath, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content, "utf8");
}

describe("computeDatasetFingerprint", () => {
  it("is deterministic for repeated calls on identical content", async () => {
    const fixtureRoot = await mkdtemp(path.join(tmpdir(), "dcm-fp-repeat-"));

    try {
      await writeTestFile(fixtureRoot, "classes.json", '{"name":"Bard"}');
      await writeTestFile(fixtureRoot, "nested/spells.json", '{"name":"Mage Hand"}');

      const firstResult = await computeDatasetFingerprint(fixtureRoot);
      const secondResult = await computeDatasetFingerprint(fixtureRoot);

      assert.equal(firstResult.fingerprint, secondResult.fingerprint);
      assert.deepEqual(firstResult.files, secondResult.files);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("is stable regardless of file creation order", async () => {
    const fixtureRootA = await mkdtemp(path.join(tmpdir(), "dcm-fp-order-a-"));
    const fixtureRootB = await mkdtemp(path.join(tmpdir(), "dcm-fp-order-b-"));

    try {
      await writeTestFile(fixtureRootA, "a/classes.json", '{"name":"Wizard"}');
      await writeTestFile(fixtureRootA, "b/spells.json", '{"name":"Shield"}');

      await writeTestFile(fixtureRootB, "b/spells.json", '{"name":"Shield"}');
      await writeTestFile(fixtureRootB, "a/classes.json", '{"name":"Wizard"}');

      const resultA = await computeDatasetFingerprint(fixtureRootA);
      const resultB = await computeDatasetFingerprint(fixtureRootB);

      assert.equal(resultA.fingerprint, resultB.fingerprint);
    } finally {
      await rm(fixtureRootA, { recursive: true, force: true });
      await rm(fixtureRootB, { recursive: true, force: true });
    }
  });

  it("changes when file content changes", async () => {
    const fixtureRoot = await mkdtemp(path.join(tmpdir(), "dcm-fp-change-"));

    try {
      await writeTestFile(fixtureRoot, "classes.json", '{"name":"Fighter"}');
      const before = await computeDatasetFingerprint(fixtureRoot);

      await writeTestFile(fixtureRoot, "classes.json", '{"name":"Paladin"}');
      const after = await computeDatasetFingerprint(fixtureRoot);

      assert.notEqual(before.fingerprint, after.fingerprint);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });
});
