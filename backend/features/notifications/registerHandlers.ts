import { registerNotificationHandler } from "@/features/notifications/notificationHandler";
import { registerPushHandler } from "@/features/notifications/pushHandler";

let registered = false;

/** Idempotent bootstrap for domain event subscribers. */
export function ensureNotificationHandlersRegistered(): void {
  if (registered) return;
  registered = true;
  registerNotificationHandler();
  registerPushHandler();
}
