import type { Prisma, PrismaClient } from "@prisma/client";

import { CharacterRepository } from "@/server/services/db/characters";
import { prisma as defaultPrisma } from "@/server/services/db/client";
import { DbQueryError, DbTransactionError } from "@/server/services/db/errors";
import { UserRepository } from "@/server/services/db/users";

interface TransactionRepositories {
  characters: CharacterRepository;
  users: UserRepository;
}

export class DBServiceClass {
  readonly characters: CharacterRepository;
  readonly users: UserRepository;

  constructor(private readonly db: PrismaClient = defaultPrisma) {
    this.characters = new CharacterRepository(db);
    this.users = new UserRepository(db);
  }

  async withTransaction<T>(
    action: (repositories: TransactionRepositories) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.db.$transaction(async (tx) => action(this.createRepositories(tx)));
    } catch (error) {
      throw new DbTransactionError(undefined, error);
    }
  }

  private createRepositories(tx: Prisma.TransactionClient): TransactionRepositories {
    return {
      characters: new CharacterRepository(tx),
      users: new UserRepository(tx),
    };
  }
}

export async function runDbQuery<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new DbQueryError(undefined, error);
  }
}

export const DBService = new DBServiceClass();

export { CharacterRepository, UserRepository };
