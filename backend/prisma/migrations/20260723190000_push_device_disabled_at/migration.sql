-- Soft-deactivate stale Expo push tokens (DeviceNotRegistered) without losing history.
ALTER TABLE "PushDevice" ADD COLUMN "disabledAt" TIMESTAMP(3);

CREATE INDEX "PushDevice_userId_disabledAt_idx" ON "PushDevice"("userId", "disabledAt");
