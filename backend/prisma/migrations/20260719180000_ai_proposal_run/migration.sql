-- Rename enums and extend source with history
ALTER TYPE "AiIngestSource" RENAME TO "AiProposalSource";
ALTER TYPE "AiProposalSource" ADD VALUE 'history';

ALTER TYPE "AiIngestStatus" RENAME TO "AiProposalStatus";

-- Rename table
ALTER TABLE "AiIngestRun" RENAME TO "AiProposalRun";

-- New columns
ALTER TABLE "AiProposalRun" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "AiProposalRun" ADD COLUMN "proposalType" TEXT;
ALTER TABLE "AiProposalRun" ADD COLUMN "proposalVersion" INTEGER;
ALTER TABLE "AiProposalRun" ADD COLUMN "provider" TEXT;

-- Backfill workspaceId from list
UPDATE "AiProposalRun" AS r
SET "workspaceId" = l."workspaceId"
FROM "ShoppingList" AS l
WHERE r."listId" = l."id";

-- Backfill generator telemetry for existing ingest runs
UPDATE "AiProposalRun"
SET
  "proposalType" = 'shopping-import',
  "proposalVersion" = CASE
    WHEN "promptVersion" ~ '^[0-9]+$' THEN CAST("promptVersion" AS INTEGER)
    WHEN "promptVersion" ~ '^v([0-9]+)$' THEN CAST(substring("promptVersion" from 2) AS INTEGER)
    ELSE 4
  END,
  "provider" = 'openai'
WHERE "proposalType" IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE "AiProposalRun" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "AiProposalRun" ALTER COLUMN "proposalType" SET NOT NULL;
ALTER TABLE "AiProposalRun" ALTER COLUMN "proposalVersion" SET NOT NULL;
ALTER TABLE "AiProposalRun" ALTER COLUMN "provider" SET NOT NULL;

-- listId nullable (history suggest before create)
ALTER TABLE "AiProposalRun" ALTER COLUMN "listId" DROP NOT NULL;

-- Drop legacy promptVersion
ALTER TABLE "AiProposalRun" DROP COLUMN "promptVersion";

-- Rename constraints / indexes
ALTER INDEX "AiIngestRun_pkey" RENAME TO "AiProposalRun_pkey";
ALTER INDEX "AiIngestRun_listId_createdAt_idx" RENAME TO "AiProposalRun_listId_createdAt_idx";

ALTER TABLE "AiProposalRun" RENAME CONSTRAINT "AiIngestRun_listId_fkey" TO "AiProposalRun_listId_fkey";

CREATE INDEX "AiProposalRun_workspaceId_createdAt_idx" ON "AiProposalRun"("workspaceId", "createdAt");

ALTER TABLE "AiProposalRun"
  ADD CONSTRAINT "AiProposalRun_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
