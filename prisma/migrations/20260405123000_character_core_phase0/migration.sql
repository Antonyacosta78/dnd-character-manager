-- AlterTable
ALTER TABLE "Character" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "Character" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "CharacterBuildState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "classSource" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    CONSTRAINT "CharacterBuildState_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterValidationOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "acknowledgedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CharacterValidationOverride_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterBuildState_characterId_key" ON "CharacterBuildState"("characterId");

-- CreateIndex
CREATE INDEX "CharacterValidationOverride_characterId_acknowledgedAt_idx" ON "CharacterValidationOverride"("characterId", "acknowledgedAt");
