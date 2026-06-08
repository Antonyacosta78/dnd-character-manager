export interface CharacterSummary {
  id: string;
  name: string;
  ownerUserId: string;
  updatedAt: Date;
}

interface CharacterRepositoryDb {
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

export class CharacterRepository {
  constructor(private readonly db: CharacterRepositoryDb) {}

  async listByOwner(ownerUserId: string): Promise<CharacterSummary[]> {
    return this.db.character.findMany({
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
  }
}
