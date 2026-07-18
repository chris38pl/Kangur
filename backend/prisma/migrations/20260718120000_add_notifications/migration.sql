-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WORKSPACE_INVITATION', 'SHOPPING_STARTED', 'SHOPPING_FINISHED', 'SHOPPING_LIST_CREATED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ');

-- CreateEnum
CREATE TYPE "NotificationPayloadType" AS ENUM ('INVITE', 'LIST', 'WORKSPACE', 'SHOPPING');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "workspaceId" TEXT,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sourceId" TEXT,
    "payloadType" "NotificationPayloadType" NOT NULL,
    "payloadSchemaVersion" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationPreferences" (
    "userId" TEXT NOT NULL,
    "workspaceInvitations" BOOLEAN NOT NULL DEFAULT true,
    "shoppingStarted" BOOLEAN NOT NULL DEFAULT true,
    "shoppingFinished" BOOLEAN NOT NULL DEFAULT true,
    "shoppingListCreated" BOOLEAN NOT NULL DEFAULT false,
    "appUpdates" BOOLEAN NOT NULL DEFAULT false,
    "newFeatures" BOOLEAN NOT NULL DEFAULT false,
    "offersPromos" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationPreferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PushDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expoToken" TEXT NOT NULL,
    "platform" TEXT,
    "appVersion" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingSession" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "clientInstanceId" TEXT,
    "clientPlatform" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ShoppingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_createdAt_idx" ON "Notification"("recipientUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_status_idx" ON "Notification"("recipientUserId", "status");

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_type_sourceId_idx" ON "Notification"("recipientUserId", "type", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "PushDevice_expoToken_key" ON "PushDevice"("expoToken");

-- CreateIndex
CREATE INDEX "PushDevice_userId_idx" ON "PushDevice"("userId");

-- CreateIndex
CREATE INDEX "ShoppingSession_listId_actorUserId_idx" ON "ShoppingSession"("listId", "actorUserId");

-- CreateIndex
CREATE INDEX "ShoppingSession_workspaceId_idx" ON "ShoppingSession"("workspaceId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationPreferences" ADD CONSTRAINT "UserNotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushDevice" ADD CONSTRAINT "PushDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingSession" ADD CONSTRAINT "ShoppingSession_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingSession" ADD CONSTRAINT "ShoppingSession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingSession" ADD CONSTRAINT "ShoppingSession_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
