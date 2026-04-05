import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import {
  createPrismaCatalogPublishRepository,
  toPayloadOverflowIssues,
} from "@/server/adapters/prisma/catalog-publish-repository";
import { CatalogActivationGuardError } from "@/server/ports/catalog-publish-repository";

function createNormalizedEntity(identity: string, payload: Record<string, unknown>) {
  return {
    kind: "class" as const,
    identity,
    name: payload.name as string,
    source: (payload.source as string) ?? "PHB",
    payload,
    edition: undefined,
  };
}

function createFakeDb() {
  const versions: Array<Record<string, unknown>> = [];
  const runtimeState: { activeCatalogVersionId: string | null } = {
    activeCatalogVersionId: null,
  };
  const activationEvents: Array<Record<string, unknown>> = [];
  const locks = new Map<string, string>();
  const entities = new Map<string, Array<Record<string, unknown>>>();

  let nextId = 1;

  const db: {
    [key: string]: unknown;
    $transaction: <T>(callback: (tx: unknown) => Promise<T>) => Promise<T>;
  } = {
    catalogVersion: {
      async findFirst() {
        return (
          versions.find((version) => {
            return version.status === "published" && version.phase1CompletedAt && !version.activatedAt;
          }) ?? null
        );
      },
      async findUnique(args: { where: { id: string } }) {
        return versions.find((version) => version.id === args.where.id) ?? null;
      },
      async upsert(args: {
        where: {
          providerKind_datasetFingerprint_importerVersion: {
            providerKind: string;
            datasetFingerprint: string;
            importerVersion: string;
          };
        };
        create: Record<string, unknown>;
      }) {
        const key = args.where.providerKind_datasetFingerprint_importerVersion;
        const existing = versions.find(
          (version) =>
            version.providerKind === key.providerKind &&
            version.datasetFingerprint === key.datasetFingerprint &&
            version.importerVersion === key.importerVersion,
        );

        if (existing) {
          return { id: existing.id };
        }

        const created = {
          id: `v${nextId++}`,
          providerKind: args.create.providerKind,
          datasetFingerprint: args.create.datasetFingerprint,
          importerVersion: args.create.importerVersion,
          status: "draft",
          phase1CompletedAt: null,
          phase1Fingerprint: null,
          activatedAt: null,
        };

        versions.push(created);
        return { id: created.id };
      },
      async update(args: { where: { id: string }; data: Record<string, unknown> }) {
        const target = versions.find((version) => version.id === args.where.id);
        if (!target) {
          throw new Error("missing version");
        }

        Object.assign(target, args.data);
        return target;
      },
    },
    catalogVersionPublishLock: {
      async create(args: { data: { catalogVersionId: string; runId: string } }) {
        if (locks.has(args.data.catalogVersionId)) {
          throw { code: "P2002" };
        }

        locks.set(args.data.catalogVersionId, args.data.runId);
      },
      async delete(args: { where: { catalogVersionId: string } }) {
        locks.delete(args.where.catalogVersionId);
      },
    },
    catalogEntity: {
      async deleteMany(args: { where: { catalogVersionId: string } }) {
        entities.set(args.where.catalogVersionId, []);
      },
      async createMany(args: { data: Array<Record<string, unknown>> }) {
        const versionId = args.data[0]?.catalogVersionId as string;
        entities.set(versionId, args.data);
      },
    },
    catalogFeatureReference: {
      async deleteMany() {
        return;
      },
      async createMany() {
        return;
      },
    },
    catalogSpellSourceEdge: {
      async deleteMany() {
        return;
      },
      async createMany() {
        return;
      },
    },
    catalogRuntimeState: {
      async findUnique() {
        return runtimeState;
      },
      async upsert(args: { create: { activeCatalogVersionId: string }; update: { activeCatalogVersionId: string } }) {
        runtimeState.activeCatalogVersionId =
          args.update.activeCatalogVersionId ?? args.create.activeCatalogVersionId;
      },
    },
    catalogActivationEvent: {
      async create(args: { data: Record<string, unknown> }) {
        activationEvents.push(args.data);
      },
    },
    async $transaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T> {
      return callback(db);
    },
  };

  return {
    db,
    state: {
      versions,
      runtimeState,
      activationEvents,
      entities,
      locks,
    },
  };
}

describe("catalog publish repository", () => {
  it("aggregates payload overflow diagnostics across all rows", () => {
    const huge = "x".repeat(2 * 1024 * 1024 + 16);
    const issues = toPayloadOverflowIssues([
      createNormalizedEntity("class:a|phb", { name: "A", source: "PHB", text: huge }),
      createNormalizedEntity("class:b|phb", { name: "B", source: "PHB", text: huge }),
    ] as never);

    assert.equal(issues.length, 2);
    assert.equal(issues[0]?.code, "PUBLISH_PAYLOAD_JSON_TOO_LARGE");
    assert.equal(issues[1]?.code, "PUBLISH_PAYLOAD_JSON_TOO_LARGE");
  });

  it("blocks activation when phase 1 marker is missing", async () => {
    const { db, state } = createFakeDb();
    const repository = createPrismaCatalogPublishRepository(db as never);

    state.versions.push({
      id: "v1",
      providerKind: "derived",
      datasetFingerprint: "sha256:test",
      importerVersion: "test",
      status: "published",
      phase1CompletedAt: null,
      phase1Fingerprint: null,
      activatedAt: null,
    });

    await assert.rejects(
      () =>
        repository.activatePublishedCatalog({
          catalogVersionId: "v1",
          datasetFingerprint: "sha256:test",
          runId: "run-1",
        }),
      (error: unknown) => error instanceof CatalogActivationGuardError,
    );
  });

  it("recovers pending phase 2 activation idempotently", async () => {
    const { db, state } = createFakeDb();
    const repository = createPrismaCatalogPublishRepository(db as never);

    const normalized = {
      entities: [createNormalizedEntity("class:bard|phb", { name: "Bard", source: "PHB" })],
      featureReferences: [],
      spellSourceEdges: [],
    };

    const phase1 = await repository.publishPhase1({
      providerKind: "derived",
      datasetFingerprint: "sha256:one",
      importerVersion: "v1",
      normalized: normalized as never,
      runId: "run-1",
    });

    assert.equal(state.runtimeState.activeCatalogVersionId, null);

    const recovered = await repository.recoverPendingActivation({ runId: "run-2" });
    assert.equal(recovered?.catalogVersionId, phase1.catalogVersionId);
    assert.equal(state.runtimeState.activeCatalogVersionId, phase1.catalogVersionId);
    assert.equal(state.activationEvents.length, 1);

    const secondRecover = await repository.recoverPendingActivation({ runId: "run-3" });
    assert.equal(secondRecover, null);

    await repository.activatePublishedCatalog({
      catalogVersionId: phase1.catalogVersionId,
      datasetFingerprint: "sha256:one",
      runId: "run-4",
    });

    assert.equal(state.activationEvents.length, 1);
  });

  it("replaces rows only for the target version and enforces lock guard", async () => {
    const { db, state } = createFakeDb();
    const repository = createPrismaCatalogPublishRepository(db as never);

    const a1 = await repository.publishPhase1({
      providerKind: "derived",
      datasetFingerprint: "sha256:a",
      importerVersion: "v1",
      normalized: {
        entities: [createNormalizedEntity("class:bard|phb", { name: "Bard", source: "PHB" })],
        featureReferences: [],
        spellSourceEdges: [],
      } as never,
      runId: "run-a1",
    });

    const b1 = await repository.publishPhase1({
      providerKind: "derived",
      datasetFingerprint: "sha256:b",
      importerVersion: "v1",
      normalized: {
        entities: [createNormalizedEntity("class:cleric|phb", { name: "Cleric", source: "PHB" })],
        featureReferences: [],
        spellSourceEdges: [],
      } as never,
      runId: "run-b1",
    });

    assert.equal(state.entities.get(a1.catalogVersionId)?.length, 1);
    assert.equal(state.entities.get(b1.catalogVersionId)?.length, 1);

    state.locks.set(a1.catalogVersionId, "external-run");
    await assert.rejects(() =>
      repository.publishPhase1({
        providerKind: "derived",
        datasetFingerprint: "sha256:a",
        importerVersion: "v1",
        normalized: {
          entities: [createNormalizedEntity("class:druid|phb", { name: "Druid", source: "PHB" })],
          featureReferences: [],
          spellSourceEdges: [],
        } as never,
        runId: "run-a2",
      }),
    );

    state.locks.delete(a1.catalogVersionId);
    await repository.publishPhase1({
      providerKind: "derived",
      datasetFingerprint: "sha256:a",
      importerVersion: "v1",
      normalized: {
        entities: [createNormalizedEntity("class:druid|phb", { name: "Druid", source: "PHB" })],
        featureReferences: [],
        spellSourceEdges: [],
      } as never,
      runId: "run-a3",
    });

    assert.equal((state.entities.get(a1.catalogVersionId)?.[0]?.name as string) ?? "", "Druid");
    assert.equal((state.entities.get(b1.catalogVersionId)?.[0]?.name as string) ?? "", "Cleric");
  });
});
