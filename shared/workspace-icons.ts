export const WORKSPACE_ICONS = [
  { id: "home", emoji: "🏠" },
  { id: "house", emoji: "🏡" },
  { id: "cart", emoji: "🛒" },
  { id: "kangaroo", emoji: "🦘" },
  { id: "office", emoji: "🏢" },
  { id: "car", emoji: "🚗" },
  { id: "party", emoji: "🎉" },
  { id: "camping", emoji: "🏕️" },
  { id: "tree", emoji: "🎄" },
  { id: "beach", emoji: "🏖️" },
  { id: "burger", emoji: "🍔" },
  { id: "meat", emoji: "🥩" },
  { id: "veggie", emoji: "🥦" },
  { id: "dog", emoji: "🐶" },
  { id: "cat", emoji: "🐱" },
  { id: "heart", emoji: "❤️" },
  { id: "star", emoji: "⭐" },
  { id: "box", emoji: "📦" },
  { id: "books", emoji: "📚" },
  { id: "briefcase", emoji: "💼" },
  { id: "family", emoji: "👨‍👩‍👧" },
  { id: "plane", emoji: "✈️" },
  { id: "soccer", emoji: "⚽" },
  { id: "game", emoji: "🎮" },
  { id: "coffee", emoji: "☕" },
  { id: "pizza", emoji: "🍕" },
  { id: "clean", emoji: "🧹" },
  { id: "laundry", emoji: "🧺" },
  { id: "ice", emoji: "🧊" },
  { id: "plant", emoji: "🌱" },
] as const;

export type WorkspaceIconId = (typeof WORKSPACE_ICONS)[number]["id"];

export function isWorkspaceIconId(value: string): value is WorkspaceIconId {
  return WORKSPACE_ICONS.some((i) => i.id === value);
}

export function getWorkspaceIconEmoji(id: string): string | undefined {
  return WORKSPACE_ICONS.find((i) => i.id === id)?.emoji;
}
