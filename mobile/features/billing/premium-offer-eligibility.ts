/**
 * Who sees the Premium trial offer after their first successful AI import.
 * Pure so it can be tested with node --test.
 */
export type PremiumOfferTrigger = "ai_import" | "meal" | "history";

export type PremiumOfferInput = {
  platformOS: string;
  /** BillingService.purchaseUnavailableReason() === null */
  purchasesAvailable: boolean;
  flagEnabled: boolean;
  alreadyShown: boolean;
  appliedCount: number;
  workspace:
    | {
        plan: "free" | "premium";
        role: "owner" | "admin" | "member";
        billingStatus: string;
      }
    | null
    | undefined;
};

export function shouldOfferPremiumAfterWin(input: PremiumOfferInput): boolean {
  if (input.platformOS !== "ios" && input.platformOS !== "android") return false;
  if (!input.purchasesAvailable || !input.flagEnabled) return false;
  if (input.alreadyShown || input.appliedCount < 1) return false;
  const ws = input.workspace;
  if (!ws || ws.plan !== "free") return false;
  if (ws.role !== "owner" && ws.role !== "admin") return false;
  // Had a subscription before: the store would not give a free month again.
  return ws.billingStatus === "none";
}
