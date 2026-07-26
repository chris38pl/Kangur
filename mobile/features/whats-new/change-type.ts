import type { ChangeType } from "./types";

export const CHANGE_TYPE_EMOJI: Record<ChangeType, string> = {
  feature: "✨",
  improvement: "⚡",
  fix: "🐛",
  security: "🔒",
  breaking: "⚠️",
};

export function changeTypeLabelKey(type: ChangeType): string {
  return `whatsNew.types.${type}`;
}
