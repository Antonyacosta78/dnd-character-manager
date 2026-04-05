import { prisma } from "@/server/adapters/prisma/prisma-client";
import type {
  CharacterRepository,
  CharacterSummary,
} from "@/server/ports/character-repository";

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
  };
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
  };
}
