import type { PrismaClient } from "@prisma/client";

import { prisma as defaultPrisma } from "@/server/adapters/prisma/prisma-client";
import type {
  BackgroundDefinition,
  ClassDefinition,
  DatasetVersion,
  FeatDefinition,
  FeatureDefinition,
  FeatureRef,
  RaceDefinition,
  RulesCatalog,
  RulesEntityDefinition,
  RulesRef,
  SpellDefinition,
  SpellFilter,
  SubclassDefinition,
} from "@/server/ports/rules-catalog";

export class RulesCatalogUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RulesCatalogUnavailableError";
  }
}

interface ActiveContext {
  versionId: string;
  fingerprint: string;
  label: string | null;
  publishedAt: Date | null;
}

function normalizeSearch(search: string | undefined): string | undefined {
  const value = search?.trim();
  return value && value.length > 0 ? value : undefined;
}

function mapEntity<TEntity extends RulesEntityDefinition>(
  row: { name: string; source: string; payloadJson: string },
  mapper?: (payload: Record<string, unknown>) => Partial<TEntity>,
): TEntity {
  const payload = JSON.parse(row.payloadJson) as Record<string, unknown>;
  const mapped = mapper ? mapper(payload) : ({} as Partial<TEntity>);

  return {
    ref: {
      name: row.name,
      source: row.source,
    },
    sourcePage: typeof payload.page === "number" ? payload.page : undefined,
    payload,
    ...mapped,
  } as TEntity;
}

export function createDerivedRulesCatalog(db: PrismaClient = defaultPrisma): RulesCatalog {
  const cache = new Map<string, unknown>();
  let cachedFingerprint: string | null = null;

  const getActiveContext = async (): Promise<ActiveContext> => {
    const runtime = await db.catalogRuntimeState.findUnique({
      where: { id: 1 },
      select: {
        activeCatalogVersion: {
          select: {
            id: true,
            datasetFingerprint: true,
            datasetLabel: true,
            publishedAt: true,
          },
        },
      },
    });

    const active = runtime?.activeCatalogVersion;
    if (!active) {
      throw new RulesCatalogUnavailableError("No active catalog version.");
    }

    if (cachedFingerprint !== active.datasetFingerprint) {
      cache.clear();
      cachedFingerprint = active.datasetFingerprint;
    }

    return {
      versionId: active.id,
      fingerprint: active.datasetFingerprint,
      label: active.datasetLabel,
      publishedAt: active.publishedAt,
    };
  };

  const getCached = async <T>(key: string, loader: () => Promise<T>): Promise<T> => {
    if (cache.has(key)) {
      return cache.get(key) as T;
    }

    const value = await loader();
    cache.set(key, value);
    return value;
  };

  const listByKind = async <TEntity extends RulesEntityDefinition>(
    kind: string,
    search?: string,
    sourceFilter?: string[],
    mapper?: (payload: Record<string, unknown>) => Partial<TEntity>,
  ): Promise<TEntity[]> => {
    const active = await getActiveContext();
    const normalizedSearch = normalizeSearch(search);
    const cacheKey = JSON.stringify([
      "list",
      kind,
      active.fingerprint,
      normalizedSearch,
      sourceFilter ?? null,
    ]);

    return getCached(cacheKey, async () => {
      const rows = await db.catalogEntity.findMany({
        where: {
          catalogVersionId: active.versionId,
          kind,
          name: normalizedSearch
            ? {
                contains: normalizedSearch,
              }
            : undefined,
          source:
            sourceFilter && sourceFilter.length > 0 ? { in: sourceFilter } : undefined,
        },
        orderBy: [{ name: "asc" }, { source: "asc" }],
      });

      return rows.map((row: { name: string; source: string; payloadJson: string }) =>
        mapEntity<TEntity>(row, mapper),
      );
    });
  };

  const getByRef = async <TEntity extends RulesEntityDefinition>(
    kind: string,
    ref: RulesRef,
    mapper?: (payload: Record<string, unknown>) => Partial<TEntity>,
  ): Promise<TEntity | null> => {
    const active = await getActiveContext();
    const cacheKey = JSON.stringify(["get", kind, active.fingerprint, ref.name, ref.source]);

    return getCached(cacheKey, async () => {
      const row = await db.catalogEntity.findFirst({
        where: {
          catalogVersionId: active.versionId,
          kind,
          name: ref.name,
          source: ref.source,
        },
      });

      return row ? mapEntity<TEntity>(row, mapper) : null;
    });
  };

  return {
    async getDatasetVersion(): Promise<DatasetVersion> {
      const active = await getActiveContext();
      return {
        provider: "derived",
        fingerprint: active.fingerprint,
        label: active.label ?? undefined,
        generatedAt: active.publishedAt?.toISOString(),
      };
    },

    classes: {
      get: (ref): Promise<ClassDefinition | null> => getByRef<ClassDefinition>("class", ref),
      list: (filter): Promise<ClassDefinition[]> =>
        listByKind<ClassDefinition>("class", filter?.search, filter?.sources),
    },

    subclasses: {
      async get(args): Promise<SubclassDefinition | null> {
        const subclass = await getByRef<SubclassDefinition>("subclass", args.subclassRef, (payload) => ({
          classRef: {
            name: (payload.className as string | undefined) ?? args.classRef.name,
            source: (payload.classSource as string | undefined) ?? args.classRef.source,
          },
        }));

        if (!subclass) {
          return null;
        }

        if (
          subclass.classRef.name !== args.classRef.name ||
          subclass.classRef.source !== args.classRef.source
        ) {
          return null;
        }

        return subclass;
      },
      listByClass: async (classRef): Promise<SubclassDefinition[]> => {
        const subclasses = await listByKind<SubclassDefinition>(
          "subclass",
          undefined,
          undefined,
          (payload) => ({
            classRef: {
              name: (payload.className as string | undefined) ?? "",
              source: (payload.classSource as string | undefined) ?? "PHB",
            },
          }),
        );

        return subclasses.filter(
          (candidate) =>
            candidate.classRef.name === classRef.name &&
            candidate.classRef.source === classRef.source,
        );
      },
    },

    races: {
      get: (ref): Promise<RaceDefinition | null> => getByRef<RaceDefinition>("race", ref),
      list: (filter): Promise<RaceDefinition[]> =>
        listByKind<RaceDefinition>("race", filter?.search, filter?.sources),
    },

    backgrounds: {
      get: (ref): Promise<BackgroundDefinition | null> =>
        getByRef<BackgroundDefinition>("background", ref),
      list: (filter): Promise<BackgroundDefinition[]> =>
        listByKind<BackgroundDefinition>("background", filter?.search, filter?.sources),
    },

    spells: {
      get: (ref): Promise<SpellDefinition | null> =>
        getByRef<SpellDefinition>("spell", ref, (payload) => ({
          level: typeof payload.level === "number" ? payload.level : undefined,
          school: typeof payload.school === "string" ? payload.school : undefined,
        })),
      async list(filter?: SpellFilter): Promise<SpellDefinition[]> {
        const active = await getActiveContext();
        const cacheKey = JSON.stringify(["spell-list", active.fingerprint, filter ?? null]);

        return getCached(cacheKey, async () => {
          const classRefPairs =
            filter?.classRefs?.map((ref) => ({
              ownerName: ref.name,
              ownerSource: ref.source,
            })) ?? [];

          const spellRefFilter: Array<{ spellName: string; spellSource: string }> | null =
            classRefPairs.length > 0
              ? await db.catalogSpellSourceEdge.findMany({
                  where: {
                    catalogVersionId: active.versionId,
                    OR: classRefPairs,
                  },
                  select: {
                    spellName: true,
                    spellSource: true,
                  },
                })
              : null;

          if (classRefPairs.length > 0 && (!spellRefFilter || spellRefFilter.length === 0)) {
            return [];
          }

          const spellIdentityFilter = spellRefFilter
            ? Array.from(
                new Map(
                  spellRefFilter.map((ref) => [`${ref.spellName}\u001f${ref.spellSource}`, ref]),
                ).values(),
              )
            : null;

          const rows = await db.catalogEntity.findMany({
            where: {
              catalogVersionId: active.versionId,
              kind: "spell",
              name: normalizeSearch(filter?.search)
                ? {
                    contains: normalizeSearch(filter?.search),
                  }
                : undefined,
              source:
                filter?.sources && filter.sources.length > 0
                  ? { in: filter.sources }
                  : undefined,
              OR:
                spellIdentityFilter && spellIdentityFilter.length > 0
                  ? spellIdentityFilter.map((ref: { spellName: string; spellSource: string }) => ({
                      name: ref.spellName,
                      source: ref.spellSource,
                    }))
                  : undefined,
            },
            orderBy: [{ name: "asc" }, { source: "asc" }],
          });

          const mapped = rows.map((row: { name: string; source: string; payloadJson: string }) =>
            mapEntity<SpellDefinition>(row, (payload) => ({
              level: typeof payload.level === "number" ? payload.level : undefined,
              school: typeof payload.school === "string" ? payload.school : undefined,
            })),
          );

          return mapped.filter((spell: SpellDefinition) => {
            if (filter?.levels?.length && !filter.levels.includes(spell.level ?? -1)) {
              return false;
            }
            if (
              filter?.schools?.length &&
              (!spell.school || !filter.schools.includes(spell.school))
            ) {
              return false;
            }

            if (filter?.ritualsOnly === true) {
              return spell.payload.ritual === true;
            }

            return true;
          });
        });
      },
    },

    feats: {
      get: (ref): Promise<FeatDefinition | null> => getByRef<FeatDefinition>("feat", ref),
      list: (filter): Promise<FeatDefinition[]> =>
        listByKind<FeatDefinition>("feat", filter?.search, filter?.sources),
    },

    features: {
      async resolve(ref: FeatureRef): Promise<FeatureDefinition | null> {
        const kinds = ref.type
          ? [ref.type]
          : (["classFeature", "subclassFeature"] as const);

        for (const kind of kinds) {
          const feature = await getByRef<FeatureDefinition>(kind, {
            name: ref.name,
            source: ref.source,
          });
          if (feature) {
            return {
              ...feature,
              type: typeof feature.payload.featureType === "string"
                ? (feature.payload.featureType as string)
                : undefined,
            };
          }
        }

        return null;
      },
    },
  };
}
