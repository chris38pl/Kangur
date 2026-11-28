-- Names other people see, and invitations without an address. Additive only: the code before
-- this migration ignores the new columns. Link invitations (email NULL) and the new
-- notification type exist only once app 1.0.9 creates them; see the PR for the rollback SQL.

-- CreateEnum
CREATE TYPE "InvitationKind" AS ENUM ('email', 'link');

-- CreateEnum
CREATE TYPE "DisplayNameSource" AS ENUM ('provider', 'user');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'WORKSPACE_MEMBER_JOINED';

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN "kind" "InvitationKind" NOT NULL DEFAULT 'email',
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "displayName" TEXT,
ADD COLUMN "displayNameSource" "DisplayNameSource",
ADD COLUMN "lastNameInitial" TEXT;
