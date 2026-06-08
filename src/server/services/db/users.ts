interface UserRepositoryDb {
  user: {
    findUnique(args: {
      where: { id: string };
      select: { isAdmin: true };
    }): Promise<{ isAdmin: boolean } | null>;
  };
}

export class UserRepository {
  constructor(private readonly db: UserRepositoryDb) {}

  async isAdmin(userId: string): Promise<boolean> {
    const userRecord = await this.db.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    return userRecord?.isAdmin === true;
  }
}
