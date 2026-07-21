-- AlterTable
ALTER TABLE "ShoppingList" ADD COLUMN "preferredForAi" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ShoppingList_workspaceId_preferredForAi_updatedAt_idx" ON "ShoppingList"("workspaceId", "preferredForAi", "updatedAt");
