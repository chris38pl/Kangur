-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('pending', 'bought', 'unavailable', 'removed');

-- CreateEnum
CREATE TYPE "ShoppingCategory" AS ENUM (
    'produce',
    'fruit',
    'vegetables',
    'dairy',
    'meat',
    'fish',
    'bakery',
    'frozen',
    'drinks',
    'alcohol',
    'snacks',
    'household',
    'cleaning',
    'baby',
    'pets',
    'pharmacy',
    'cosmetics',
    'electronics',
    'office',
    'garden',
    'diy',
    'other'
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "listId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT,
    "quantity" TEXT,
    "unit" TEXT,
    "note" TEXT,
    "category" "ShoppingCategory" NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'pending',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "addedByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingItem_clientId_key" ON "ShoppingItem"("clientId");

-- CreateIndex
CREATE INDEX "ShoppingItem_listId_status_idx" ON "ShoppingItem"("listId", "status");

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
