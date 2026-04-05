export interface CharacterSummary {
  id: string;
  name: string;
  ownerUserId: string;
  updatedAt: Date;
}

export interface CharacterRepository {
  listByOwner(ownerUserId: string): Promise<CharacterSummary[]>;
}
