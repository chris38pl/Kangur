/** History → AI shopping list suggestions (UX gate; backend is SoT). */
export function isHistorySuggestionsEnabled(): boolean {
  const raw =
    process.env.EXPO_PUBLIC_HISTORY_SUGGESTIONS_ENABLED?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") {
    return false;
  }
  return true;
}
