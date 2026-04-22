-- AlterTable
ALTER TABLE "CharacterBuildState" ADD COLUMN "notes" TEXT;
ALTER TABLE "CharacterBuildState" ADD COLUMN "optionalRuleRefsJson" TEXT;

-- CreateTable
CREATE TABLE "CharacterInventoryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "carriedState" TEXT NOT NULL DEFAULT 'carried',
    "weight" REAL,
    "notes" TEXT,
    "catalogName" TEXT,
    "catalogSource" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterInventoryEntry_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterSpellEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "level" INTEGER,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "catalogName" TEXT,
    "catalogSource" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterSpellEntry_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterLevelHistoryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "levelNumber" INTEGER NOT NULL,
    "className" TEXT NOT NULL,
    "classSource" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CharacterLevelHistoryEntry_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterShareSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "shareEnabled" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterShareSettings_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CharacterInventoryEntry_characterId_sortOrder_idx" ON "CharacterInventoryEntry"("characterId", "sortOrder");

-- CreateIndex
CREATE INDEX "CharacterSpellEntry_characterId_sortOrder_idx" ON "CharacterSpellEntry"("characterId", "sortOrder");

-- CreateIndex
CREATE INDEX "CharacterLevelHistoryEntry_characterId_levelNumber_idx" ON "CharacterLevelHistoryEntry"("characterId", "levelNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterShareSettings_characterId_key" ON "CharacterShareSettings"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterShareSettings_shareToken_key" ON "CharacterShareSettings"("shareToken");

-- CreateIndex
CREATE INDEX "CharacterShareSettings_shareEnabled_shareToken_idx" ON "CharacterShareSettings"("shareEnabled", "shareToken");
