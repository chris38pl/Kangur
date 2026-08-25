import { brand } from "@/design-system/tokens";

export type ListLifecycleStatus = "shopping" | "waiting" | "finished";

/** Same lifecycle groups as the Lists tab (shopping / waiting / finished). */
export function resolveListLifecycleStatus(input: {
  status: "active" | "archived" | "deleted";
  hasResumableSession: boolean;
}): ListLifecycleStatus {
  if (input.status === "archived" || input.status === "deleted") {
    return "finished";
  }
  if (input.hasResumableSession) return "shopping";
  return "waiting";
}

/** Left accent bar / solid status color. */
export function listLifecycleAccentColor(
  status: ListLifecycleStatus,
  scheme: "light" | "dark",
): string {
  if (status === "shopping") return brand.unavailable;
  if (status === "finished") return brand.primary;
  // Lighter gray than textMuted so waiting reads clearly vs finished green.
  return scheme === "dark" ? "#C5CCD6" : "#B8C0CC";
}

/** Soft pill colors for compact status badges. */
export function listLifecycleBadgeColors(
  status: ListLifecycleStatus,
  scheme: "light" | "dark",
): { background: string; text: string } {
  if (status === "shopping") {
    return scheme === "dark"
      ? { background: "#3D2E16", text: "#FBBF24" }
      : { background: "#FFF4E5", text: "#C67A0A" };
  }
  if (status === "finished") {
    return scheme === "dark"
      ? { background: "#1A3330", text: brand.primaryLight }
      : { background: "#E6F7F3", text: "#2F9B88" };
  }
  return scheme === "dark"
    ? { background: "#2A323C", text: "#C5CCD6" }
    : { background: "#F0F3F6", text: "#7A8494" };
}
