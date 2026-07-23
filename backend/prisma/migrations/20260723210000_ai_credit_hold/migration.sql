-- CreateTable
CREATE TABLE "AiCreditHold" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "AiProposalSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "AiCreditHold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiCreditHold_workspaceId_releasedAt_expiresAt_idx" ON "AiCreditHold"("workspaceId", "releasedAt", "expiresAt");

-- AddForeignKey
ALTER TABLE "AiCreditHold" ADD CONSTRAINT "AiCreditHold_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
