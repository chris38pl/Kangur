import { finishTask } from "@/lib/navigation";

/** Invite accept Task — Intent-only (no Session). */
export function dismissInviteTask(): void {
  finishTask();
}

/** After join / open workspace — leave invite Task for Root. */
export function completeInviteTask(): void {
  finishTask();
}
