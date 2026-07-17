/** When true, show AI proposal review UI. Default: auto-apply (false). */
export function isAiReviewEnabled(): boolean {
  return process.env.EXPO_PUBLIC_AI_REVIEW_ENABLED?.trim() === "true";
}
