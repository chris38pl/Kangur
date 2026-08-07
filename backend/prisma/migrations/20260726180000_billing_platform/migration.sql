-- Billing Platform: entitlement without store columns; purchases + events

CREATE TYPE "BillingProviderId" AS ENUM ('google', 'apple', 'stripe');

CREATE TYPE "BillingPurchaseStatus" AS ENUM (
  'pending',
  'active',
  'trialing',
  'past_due',
  'cancelled',
  'expired',
  'revoked',
  'superseded'
);

-- New entitlement columns (keep stripe temporarily for data move)
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "featureSetAtPurchase" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingOwnerUserId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "activePurchaseId" TEXT;

CREATE TABLE "BillingPurchase" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" "BillingProviderId" NOT NULL,
    "productId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" "BillingPurchaseStatus" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "featureSetAtPurchase" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingPurchase_providerId_externalId_key" ON "BillingPurchase"("providerId", "externalId");
CREATE INDEX "BillingPurchase_workspaceId_status_idx" ON "BillingPurchase"("workspaceId", "status");
CREATE INDEX "BillingPurchase_userId_idx" ON "BillingPurchase"("userId");
CREATE INDEX "BillingPurchase_expiresAt_idx" ON "BillingPurchase"("expiresAt");

ALTER TABLE "BillingPurchase" ADD CONSTRAINT "BillingPurchase_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingPurchase" ADD CONSTRAINT "BillingPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "providerId" "BillingProviderId" NOT NULL,
    "type" TEXT NOT NULL,
    "externalId" TEXT,
    "payload" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BillingEvent_providerId_createdAt_idx" ON "BillingEvent"("providerId", "createdAt");
CREATE INDEX "BillingEvent_externalId_idx" ON "BillingEvent"("externalId");
CREATE INDEX "BillingEvent_processedAt_idx" ON "BillingEvent"("processedAt");

-- Migrate existing Stripe rows into BillingPurchase (externalId = stripeSubscriptionId or customer placeholder)
INSERT INTO "BillingPurchase" (
  "id",
  "workspaceId",
  "userId",
  "providerId",
  "productId",
  "externalId",
  "status",
  "expiresAt",
  "featureSetAtPurchase",
  "payload",
  "createdAt",
  "updatedAt"
)
SELECT
  'bp_' || s."id",
  s."workspaceId",
  w."createdByUserId",
  'stripe'::"BillingProviderId",
  'PREMIUM_MONTHLY',
  COALESCE(s."stripeSubscriptionId", 'customer:' || s."stripeCustomerId"),
  CASE s."status"
    WHEN 'active' THEN 'active'::"BillingPurchaseStatus"
    WHEN 'trialing' THEN 'trialing'::"BillingPurchaseStatus"
    WHEN 'past_due' THEN 'past_due'::"BillingPurchaseStatus"
    ELSE 'cancelled'::"BillingPurchaseStatus"
  END,
  s."currentPeriodEnd",
  'PREMIUM_V1',
  jsonb_build_object(
    'stripeCustomerId', s."stripeCustomerId",
    'stripeSubscriptionId', s."stripeSubscriptionId"
  ),
  s."createdAt",
  s."updatedAt"
FROM "Subscription" s
JOIN "Workspace" w ON w."id" = s."workspaceId"
WHERE s."stripeCustomerId" IS NOT NULL OR s."stripeSubscriptionId" IS NOT NULL
ON CONFLICT ("providerId", "externalId") DO NOTHING;

UPDATE "Subscription" s
SET
  "activePurchaseId" = bp."id",
  "productId" = 'PREMIUM_MONTHLY',
  "featureSetAtPurchase" = 'PREMIUM_V1',
  "billingOwnerUserId" = bp."userId"
FROM "BillingPurchase" bp
WHERE bp."workspaceId" = s."workspaceId"
  AND bp."providerId" = 'stripe'
  AND s."activePurchaseId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_activePurchaseId_key" ON "Subscription"("activePurchaseId");

ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_activePurchaseId_fkey"
  FOREIGN KEY ("activePurchaseId") REFERENCES "BillingPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop store columns from entitlement table
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "stripeSubscriptionId";
