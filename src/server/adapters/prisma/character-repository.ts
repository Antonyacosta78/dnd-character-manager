import { randomUUID } from "node:crypto";

import { prisma } from "@/server/adapters/prisma/prisma-client";
import type {
  CharacterAggregate,
  CharacterBuildState,
  CharacterCatalogRef,
  CharacterInventoryEntry,
  CharacterLevelHistoryEntry,
  CharacterRepository,
  CharacterShareSettings,
  CharacterSpellEntry,
  CharacterSummary,
  CreateCharacterInput,
  FinalizeLevelUpInput,
  SaveCharacterInput,
  SaveCharacterResult,
  SetCharacterShareEnabledInput,
} from "@/server/ports/character-repository";

interface CharacterWithCoreFields {
  id: string;
  name: string;
  ownerUserId: string;
  status: string;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
  buildState: {
    concept: string;
    className: string;
    classSource: string;
    level: number;
    notes: string | null;
    optionalRuleRefsJson: string | null;
  } | null;
  validationOverrides: Array<{
    code: string;
    path: string;
    acknowledgedAt: Date;
  }>;
  inventoryEntries: Array<{
    id: string;
    label: string;
    quantity: number;
    carriedState: string;
    weight: number | null;
    notes: string | null;
    catalogName: string | null;
    catalogSource: string | null;
    isCustom: boolean;
    sortOrder: number;
  }>;
  spellEntries: Array<{
    id: string;
    label: string;
    level: number | null;
    status: string;
    notes: string | null;
    catalogName: string | null;
    catalogSource: string | null;
    isCustom: boolean;
    sortOrder: number;
  }>;
  levelHistoryEntries: Array<{
    id: string;
    levelNumber: number;
    className: string;
    classSource: string;
    notes: string | null;
    createdAt: Date;
  }>;
  shareSettings: {
    shareEnabled: boolean;
    shareToken: string | null;
    updatedAt: Date;
  } | null;
}

interface CharacterDb {
  character: {
    findMany(args: {
      where: { ownerUserId: string };
      select: {
        id: true;
        name: true;
        ownerUserId: true;
        updatedAt: true;
      };
      orderBy: { updatedAt: "desc" };
    }): Promise<CharacterSummary[]>;
    create(args: {
      data: Record<string, unknown>;
      include: Record<string, unknown>;
    }): Promise<CharacterWithCoreFields>;
    findFirst(args: {
      where: Record<string, unknown>;
      include: Record<string, unknown>;
    }): Promise<CharacterWithCoreFields | null>;
    updateMany(args: {
      where: {
        id: string;
        ownerUserId: string;
        revision: number;
      };
      data: Record<string, unknown>;
    }): Promise<{ count: number }>;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
      include: Record<string, unknown>;
    }): Promise<CharacterWithCoreFields>;
  };
  characterShareSettings: {
    upsert(args: {
      where: { characterId: string };
      create: {
        characterId: string;
        shareEnabled: boolean;
        shareToken: string | null;
      };
      update: {
        shareEnabled: boolean;
        shareToken: string | null;
      };
      select: {
        shareEnabled: true;
        shareToken: true;
        updatedAt: true;
      };
    }): Promise<CharacterShareSettings>;
  };
  $transaction<T>(callback: (tx: CharacterDb) => Promise<T>): Promise<T>;
}

function includeCharacterAggregate() {
  return {
    buildState: true,
    validationOverrides: {
      orderBy: {
        acknowledgedAt: "asc" as const,
      },
    },
    inventoryEntries: {
      orderBy: {
        sortOrder: "asc" as const,
      },
    },
    spellEntries: {
      orderBy: {
        sortOrder: "asc" as const,
      },
    },
    levelHistoryEntries: {
      orderBy: {
        levelNumber: "asc" as const,
      },
    },
    shareSettings: true,
  };
}

function toCatalogRef(name: string | null, source: string | null): CharacterCatalogRef | undefined {
  if (!name || !source) {
    return undefined;
  }

  return { name, source };
}

function mapBuildState(buildState: CharacterWithCoreFields["buildState"]): CharacterBuildState {
  const optionalRuleRefs = parseOptionalRuleRefs(buildState?.optionalRuleRefsJson);

  return {
    concept: buildState?.concept ?? "",
    classRef: {
      name: buildState?.className ?? "",
      source: buildState?.classSource ?? "",
    },
    level: buildState?.level ?? 1,
    notes: buildState?.notes ?? undefined,
    optionalRuleRefs,
  };
}

function mapInventoryEntries(entries: CharacterWithCoreFields["inventoryEntries"]): CharacterInventoryEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    quantity: entry.quantity,
    carriedState: entry.carriedState === "stored" ? "stored" : "carried",
    weight: entry.weight ?? undefined,
    notes: entry.notes ?? undefined,
    catalogRef: toCatalogRef(entry.catalogName, entry.catalogSource),
    isCustom: entry.isCustom,
  }));
}

function mapSpellEntries(entries: CharacterWithCoreFields["spellEntries"]): CharacterSpellEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    level: entry.level ?? undefined,
    status: entry.status === "always" ? "always" : entry.status === "prepared" ? "prepared" : "known",
    notes: entry.notes ?? undefined,
    catalogRef: toCatalogRef(entry.catalogName, entry.catalogSource),
    isCustom: entry.isCustom,
  }));
}

function mapLevelHistory(entries: CharacterWithCoreFields["levelHistoryEntries"]): CharacterLevelHistoryEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    levelNumber: entry.levelNumber,
    classRef: {
      name: entry.className,
      source: entry.classSource,
    },
    notes: entry.notes ?? undefined,
    createdAt: entry.createdAt,
  }));
}

function mapShareSettings(settings: CharacterWithCoreFields["shareSettings"]): CharacterShareSettings {
  return {
    shareEnabled: settings?.shareEnabled ?? false,
    shareToken: settings?.shareToken ?? null,
    updatedAt: settings?.updatedAt ?? new Date(0),
  };
}

function mapCharacterAggregate(record: CharacterWithCoreFields): CharacterAggregate {
  return {
    id: record.id,
    ownerUserId: record.ownerUserId,
    name: record.name,
    status: record.status,
    revision: record.revision,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    buildState: mapBuildState(record.buildState),
    warningOverrides: record.validationOverrides.map((item) => ({
      code: item.code,
      path: item.path,
      acknowledgedAt: item.acknowledgedAt,
    })),
    inventory: mapInventoryEntries(record.inventoryEntries),
    spells: mapSpellEntries(record.spellEntries),
    levelHistory: mapLevelHistory(record.levelHistoryEntries),
    shareSettings: mapShareSettings(record.shareSettings),
  };
}

function parseOptionalRuleRefs(optionalRuleRefsJson: string | null | undefined): CharacterCatalogRef[] {
  if (!optionalRuleRefsJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(optionalRuleRefsJson) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => typeof item === "object" && item !== null)
      .map((item) => {
        const record = item as Record<string, unknown>;

        return {
          name: String(record.name ?? ""),
          source: String(record.source ?? ""),
        };
      })
      .filter((item) => item.name.length > 0 && item.source.length > 0);
  } catch {
    return [];
  }
}

function toOverrideRows(codes: string[]): Array<{ code: string; path: string }> {
  return codes.map((code) => ({ code, path: "core" }));
}

function toBuildState(draft: CreateCharacterInput["draft"]) {
  return {
    concept: draft.concept,
    className: draft.classRef.name,
    classSource: draft.classRef.source,
    level: draft.level,
    notes: draft.notes ?? null,
    optionalRuleRefsJson: JSON.stringify(draft.optionalRuleRefs ?? []),
  };
}

function toInventoryCreateMany(entries: CharacterInventoryEntry[] | undefined) {
  return {
    data: (entries ?? []).map((entry, index) => ({
      label: entry.label,
      quantity: entry.quantity,
      carriedState: entry.carriedState,
      weight: entry.weight ?? null,
      notes: entry.notes ?? null,
      catalogName: entry.catalogRef?.name ?? null,
      catalogSource: entry.catalogRef?.source ?? null,
      isCustom: entry.isCustom ?? !entry.catalogRef,
      sortOrder: index,
    })),
  };
}

function toSpellCreateMany(entries: CharacterSpellEntry[] | undefined) {
  return {
    data: (entries ?? []).map((entry, index) => ({
      label: entry.label,
      level: entry.level ?? null,
      status: entry.status,
      notes: entry.notes ?? null,
      catalogName: entry.catalogRef?.name ?? null,
      catalogSource: entry.catalogRef?.source ?? null,
      isCustom: entry.isCustom ?? !entry.catalogRef,
      sortOrder: index,
    })),
  };
}

function detectChangedSections(existing: CharacterWithCoreFields | null, input: SaveCharacterInput) {
  if (!existing) {
    return ["core"] as Array<"core" | "progression" | "inventory" | "spells" | "notes">;
  }

  const sections: Array<"core" | "progression" | "inventory" | "spells" | "notes"> = [];

  if (
    existing.name !== input.draft.name ||
    existing.buildState?.concept !== input.draft.concept ||
    existing.buildState?.className !== input.draft.classRef.name ||
    existing.buildState?.classSource !== input.draft.classRef.source
  ) {
    sections.push("core");
  }

  if (existing.buildState?.level !== input.draft.level) {
    sections.push("progression");
  }

  if ((existing.buildState?.notes ?? "") !== (input.draft.notes ?? "")) {
    sections.push("notes");
  }

  if ((existing.inventoryEntries?.length ?? 0) !== (input.draft.inventory?.length ?? 0)) {
    sections.push("inventory");
  }

  if ((existing.spellEntries?.length ?? 0) !== (input.draft.spells?.length ?? 0)) {
    sections.push("spells");
  }

  return sections.length > 0
    ? sections
    : (["core"] as Array<"core" | "progression" | "inventory" | "spells" | "notes">);
}

export function createPrismaCharacterRepository(
  db: CharacterDb = prisma as unknown as CharacterDb,
): CharacterRepository {
  return {
    async listByOwner(ownerUserId: string): Promise<CharacterSummary[]> {
      return db.character.findMany({
        where: { ownerUserId },
        select: {
          id: true,
          name: true,
          ownerUserId: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    },

    async createCharacter(input): Promise<CharacterAggregate> {
      const created = await db.character.create({
        data: {
          ownerUserId: input.ownerUserId,
          name: input.draft.name,
          status: "draft",
          revision: 1,
          buildState: {
            create: toBuildState(input.draft),
          },
          validationOverrides: {
            createMany: toOverrideRows(input.acknowledgedWarningCodes),
          },
          inventoryEntries: {
            createMany: toInventoryCreateMany(input.draft.inventory),
          },
          spellEntries: {
            createMany: toSpellCreateMany(input.draft.spells),
          },
          shareSettings: {
            create: {
              shareEnabled: false,
              shareToken: null,
            },
          },
        },
        include: includeCharacterAggregate(),
      });

      return mapCharacterAggregate(created);
    },

    async getByIdForOwner(characterId, ownerUserId): Promise<CharacterAggregate | null> {
      const character = await db.character.findFirst({
        where: {
          id: characterId,
          ownerUserId,
        },
        include: includeCharacterAggregate(),
      });

      if (!character) {
        return null;
      }

      return mapCharacterAggregate(character);
    },

    async getByShareToken(shareToken): Promise<CharacterAggregate | null> {
      const character = await db.character.findFirst({
        where: {
          shareSettings: {
            is: {
              shareEnabled: true,
              shareToken,
            },
          },
        },
        include: includeCharacterAggregate(),
      });

      if (!character) {
        return null;
      }

      return mapCharacterAggregate(character);
    },

    async saveCanonical(input: SaveCharacterInput): Promise<SaveCharacterResult> {
      return db.$transaction(async (tx) => {
        const updated = await tx.character.updateMany({
          where: {
            id: input.characterId,
            ownerUserId: input.ownerUserId,
            revision: input.baseRevision,
          },
          data: {
            name: input.draft.name,
            revision: {
              increment: 1,
            },
          },
        });

        if (updated.count === 0) {
          const existing = await tx.character.findFirst({
            where: {
              id: input.characterId,
              ownerUserId: input.ownerUserId,
            },
            include: includeCharacterAggregate(),
          });

          return {
            kind: "conflict",
            characterId: input.characterId,
            baseRevision: input.baseRevision,
            serverRevision: existing?.revision ?? input.baseRevision,
            changedSections: detectChangedSections(existing, input),
          };
        }

        const saved = await tx.character.update({
          where: {
            id: input.characterId,
          },
          data: {
            status: "active",
            buildState: {
              upsert: {
                create: toBuildState(input.draft),
                update: toBuildState(input.draft),
              },
            },
            validationOverrides: {
              deleteMany: {},
              createMany: toOverrideRows(input.acknowledgedWarningCodes),
            },
            inventoryEntries: {
              deleteMany: {},
              createMany: toInventoryCreateMany(input.draft.inventory),
            },
            spellEntries: {
              deleteMany: {},
              createMany: toSpellCreateMany(input.draft.spells),
            },
          },
          include: includeCharacterAggregate(),
        });

        return {
          kind: "saved",
          character: mapCharacterAggregate(saved),
        };
      });
    },

    async finalizeLevelUp(input: FinalizeLevelUpInput): Promise<SaveCharacterResult> {
      return db.$transaction(async (tx) => {
        const updated = await tx.character.updateMany({
          where: {
            id: input.characterId,
            ownerUserId: input.ownerUserId,
            revision: input.baseRevision,
          },
          data: {
            revision: {
              increment: 1,
            },
          },
        });

        if (updated.count === 0) {
          const existing = await tx.character.findFirst({
            where: {
              id: input.characterId,
              ownerUserId: input.ownerUserId,
            },
            include: includeCharacterAggregate(),
          });

          return {
            kind: "conflict",
            characterId: input.characterId,
            baseRevision: input.baseRevision,
            serverRevision: existing?.revision ?? input.baseRevision,
            changedSections: ["progression"],
          };
        }

        const saved = await tx.character.update({
          where: { id: input.characterId },
          data: {
            status: "active",
            buildState: {
              update: {
                className: input.classRef.name,
                classSource: input.classRef.source,
                level: input.levelNumber,
              },
            },
            levelHistoryEntries: {
              create: {
                levelNumber: input.levelNumber,
                className: input.classRef.name,
                classSource: input.classRef.source,
                notes: input.notes ?? null,
              },
            },
          },
          include: includeCharacterAggregate(),
        });

        return {
          kind: "saved",
          character: mapCharacterAggregate(saved),
        };
      });
    },

    async setShareEnabled(input: SetCharacterShareEnabledInput): Promise<CharacterShareSettings> {
      const token = input.enabled ? `share_${randomUUID()}` : null;

      const settings = await db.characterShareSettings.upsert({
        where: {
          characterId: input.characterId,
        },
        create: {
          characterId: input.characterId,
          shareEnabled: input.enabled,
          shareToken: token,
        },
        update: {
          shareEnabled: input.enabled,
          shareToken: token,
        },
        select: {
          shareEnabled: true,
          shareToken: true,
          updatedAt: true,
        },
      });

      return {
        shareEnabled: settings.shareEnabled,
        shareToken: settings.shareToken,
        updatedAt: settings.updatedAt,
      };
    },
  };
}
