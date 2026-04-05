-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CatalogVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerKind" TEXT NOT NULL,
    "datasetFingerprint" TEXT NOT NULL,
    "datasetLabel" TEXT,
    "sourceRef" TEXT,
    "importerVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" DATETIME,
    "publishedAt" DATETIME,
    "phase1CompletedAt" DATETIME,
    "phase1Fingerprint" TEXT,
    "activatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "CatalogImportRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "catalogVersionId" TEXT,
    "triggerKind" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "integrityMode" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'running',
    "currentStage" TEXT NOT NULL,
    "datasetFingerprintObserved" TEXT,
    "sourceManifestJson" TEXT,
    "stageMetricsJson" TEXT,
    "errorSummary" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "CatalogImportRun_catalogVersionId_fkey" FOREIGN KEY ("catalogVersionId") REFERENCES "CatalogVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogImportIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "filePath" TEXT,
    "jsonPointer" TEXT,
    "detailsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogImportIssue_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CatalogImportRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogRuntimeState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activeCatalogVersionId" TEXT,
    "lastIntegrityCheckAt" DATETIME,
    "lastIntegrityStatus" TEXT,
    "lastIntegrityMessage" TEXT,
    "dataIntegrityMode" TEXT NOT NULL DEFAULT 'strict',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CatalogRuntimeState_activeCatalogVersionId_fkey" FOREIGN KEY ("activeCatalogVersionId") REFERENCES "CatalogVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogActivationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromCatalogVersionId" TEXT,
    "toCatalogVersionId" TEXT NOT NULL,
    "runId" TEXT,
    "activatedByUserId" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogActivationEvent_fromCatalogVersionId_fkey" FOREIGN KEY ("fromCatalogVersionId") REFERENCES "CatalogVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CatalogActivationEvent_toCatalogVersionId_fkey" FOREIGN KEY ("toCatalogVersionId") REFERENCES "CatalogVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CatalogActivationEvent_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CatalogImportRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "catalogVersionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "edition" TEXT,
    "payloadJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogEntity_catalogVersionId_fkey" FOREIGN KEY ("catalogVersionId") REFERENCES "CatalogVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogFeatureReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "catalogVersionId" TEXT NOT NULL,
    "ownerKind" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerSource" TEXT NOT NULL,
    "ownerClassName" TEXT,
    "ownerClassSource" TEXT,
    "featureKind" TEXT NOT NULL,
    "featureUid" TEXT NOT NULL,
    "featureName" TEXT,
    "featureSource" TEXT,
    "flagsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogFeatureReference_catalogVersionId_fkey" FOREIGN KEY ("catalogVersionId") REFERENCES "CatalogVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogSpellSourceEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "catalogVersionId" TEXT NOT NULL,
    "spellName" TEXT NOT NULL,
    "spellSource" TEXT NOT NULL,
    "grantType" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerSource" TEXT NOT NULL,
    "ownerClassName" TEXT,
    "ownerClassSource" TEXT,
    "ownerSubclassShortName" TEXT,
    "additionType" TEXT,
    "definedInSource" TEXT,
    "definedInSourcesJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogSpellSourceEdge_catalogVersionId_fkey" FOREIGN KEY ("catalogVersionId") REFERENCES "CatalogVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogVersionPublishLock" (
    "catalogVersionId" TEXT NOT NULL PRIMARY KEY,
    "datasetFingerprint" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "acquiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogVersionPublishLock_catalogVersionId_fkey" FOREIGN KEY ("catalogVersionId") REFERENCES "CatalogVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "Character_ownerUserId_updatedAt_idx" ON "Character"("ownerUserId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogVersion_providerKind_datasetFingerprint_importerVersion_key" ON "CatalogVersion"("providerKind", "datasetFingerprint", "importerVersion");

-- CreateIndex
CREATE INDEX "CatalogImportRun_startedAt_idx" ON "CatalogImportRun"("startedAt");

-- CreateIndex
CREATE INDEX "CatalogImportRun_catalogVersionId_idx" ON "CatalogImportRun"("catalogVersionId");

-- CreateIndex
CREATE INDEX "CatalogImportIssue_runId_severity_stage_idx" ON "CatalogImportIssue"("runId", "severity", "stage");

-- CreateIndex
CREATE INDEX "CatalogActivationEvent_createdAt_idx" ON "CatalogActivationEvent"("createdAt");

-- CreateIndex
CREATE INDEX "CatalogEntity_catalogVersionId_kind_name_source_idx" ON "CatalogEntity"("catalogVersionId", "kind", "name", "source");

-- CreateIndex
CREATE INDEX "CatalogEntity_catalogVersionId_kind_source_idx" ON "CatalogEntity"("catalogVersionId", "kind", "source");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogEntity_catalogVersionId_kind_identity_key" ON "CatalogEntity"("catalogVersionId", "kind", "identity");

-- CreateIndex
CREATE INDEX "CatalogFeatureReference_catalogVersionId_ownerKind_ownerName_ownerSource_idx" ON "CatalogFeatureReference"("catalogVersionId", "ownerKind", "ownerName", "ownerSource");

-- CreateIndex
CREATE INDEX "CatalogFeatureReference_catalogVersionId_featureKind_featureUid_idx" ON "CatalogFeatureReference"("catalogVersionId", "featureKind", "featureUid");

-- CreateIndex
CREATE INDEX "CatalogSpellSourceEdge_catalogVersionId_spellName_spellSource_idx" ON "CatalogSpellSourceEdge"("catalogVersionId", "spellName", "spellSource");

-- CreateIndex
CREATE INDEX "CatalogSpellSourceEdge_catalogVersionId_ownerName_ownerSource_idx" ON "CatalogSpellSourceEdge"("catalogVersionId", "ownerName", "ownerSource");

-- CreateIndex
CREATE INDEX "CatalogSpellSourceEdge_catalogVersionId_grantType_ownerName_idx" ON "CatalogSpellSourceEdge"("catalogVersionId", "grantType", "ownerName");

-- CreateIndex
CREATE INDEX "CatalogVersionPublishLock_datasetFingerprint_idx" ON "CatalogVersionPublishLock"("datasetFingerprint");
