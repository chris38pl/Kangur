-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SHOPPING_LIST_DELETED';

-- AlterTable
ALTER TABLE "UserNotificationPreferences" ADD COLUMN "shoppingListDeleted" BOOLEAN NOT NULL DEFAULT false;
