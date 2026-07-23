import type { Href } from "expo-router";

import { finishTask, finishTaskAndOpen, goRoot } from "@/lib/navigation";

/** Notification deep-link Task — Intent-only (no Session). */
export function dismissNotificationTask(): void {
  finishTask();
}

/** Leave notification Task and open a Details/Task destination. */
export function completeNotificationTaskAndOpen(href: Href): void {
  finishTaskAndOpen(href);
}

/** Alias when destination is Root only. */
export function completeNotificationTask(): void {
  goRoot();
}
