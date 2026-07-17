-- CreateEnum
CREATE TYPE "AiIngestSource" AS ENUM ('text', 'screenshot', 'clipboard');

-- CreateEnum
CREATE TYPE "AiIngestStatus" AS ENUM ('proposed', 'applied', 'abandoned');

-- CreateTable
CREATE TABLE "AiIngestRun" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "AiIngestSource" NOT NULL,
    "status" "AiIngestStatus" NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "durationMs" INTEGER,
    "rawResponse" JSONB NOT NULL,
    "proposal" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "AiIngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiIngestRun_listId_createdAt_idx" ON "AiIngestRun"("listId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiIngestRun" ADD CONSTRAINT "AiIngestRun_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
