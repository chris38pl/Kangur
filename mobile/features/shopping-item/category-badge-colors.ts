import type { ShoppingCategory } from "@shared/shopping-categories";

/** Soft pastel color codes per aisle (icon tile bg + accent text). */
export const CATEGORY_BADGE_COLORS: Record<
  ShoppingCategory,
  { background: string; text: string }
> = {
  fruit: { background: "#FDECEF", text: "#C45C6E" },
  vegetables: { background: "#EAF7EE", text: "#3D9B5F" },
  dairy: { background: "#E8F2FB", text: "#4A7FB5" },
  meat: { background: "#FDECEC", text: "#C45C5C" },
  fish: { background: "#E4F1FA", text: "#3D7EAD" },
  bakery: { background: "#FFF1E6", text: "#D4783A" },
  frozen: { background: "#E8F4FB", text: "#4A90B5" },
  drinks: { background: "#EAF6F4", text: "#2F8F84" },
  alcohol: { background: "#E6F7F5", text: "#2F8F84" },
  snacks: { background: "#FFF6E8", text: "#C4893A" },
  household: { background: "#F3F4F6", text: "#6B7280" },
  cleaning: { background: "#EAF4FB", text: "#4A88B0" },
  baby: { background: "#FDF0F5", text: "#C46B8A" },
  pets: { background: "#F3F0EB", text: "#8B7355" },
  pharmacy: { background: "#EAF7F2", text: "#3D9B7A" },
  cosmetics: { background: "#F8EEF5", text: "#A85B8C" },
  electronics: { background: "#EEF1F6", text: "#5B6B85" },
  office: { background: "#F3F4F6", text: "#6B7280" },
  garden: { background: "#EAF7EE", text: "#3D9B5F" },
  diy: { background: "#F3F1EC", text: "#7A6F5D" },
  other: { background: "#F3F4F6", text: "#6B7280" },
};

export function getCategoryBadgeColors(category: ShoppingCategory) {
  return CATEGORY_BADGE_COLORS[category];
}
