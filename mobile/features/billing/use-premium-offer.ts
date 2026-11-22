import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import { useAppResult } from "@/components/AppResultProvider";
import { brandAssets } from "@/design-system/brand-assets";
import { BillingService } from "@/features/billing/billing-service";
import {
  shouldOfferPremiumAfterWin,
  type PremiumOfferTrigger,
} from "@/features/billing/premium-offer-eligibility";
import { premiumHref } from "@/features/billing/premium-source";
import type { Workspace } from "@/features/workspace/schemas";
import { Analytics } from "@/lib/analytics";
import { FeatureFlags, isFeatureEnabled } from "@/lib/featureFlags";

const SHOWN_KEY = "kangur.billing.premiumOffer.firstWin.v1";
/** Let the "added" toast and the new rows land before the offer. */
const OFFER_DELAY_MS = 1500;

/**
 * Returns a callback for AI success paths. The first time a free owner or admin
 * gets products onto a list with AI, it offers the Premium trial once.
 */
export function usePremiumOfferAfterWin() {
  const { show, visible } = useAppResult();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  return useCallback(
    (input: {
      workspaceId: string | null | undefined;
      appliedCount: number;
      trigger: PremiumOfferTrigger;
    }) => {
      const { workspaceId, appliedCount, trigger } = input;
      if (!workspaceId) return;
      void (async () => {
        let alreadyShown = true;
        try {
          alreadyShown = (await AsyncStorage.getItem(SHOWN_KEY)) != null;
        } catch {
          return;
        }
        const workspace = queryClient
          .getQueryData<Workspace[]>(["workspaces"])
          ?.find((w) => w.id === workspaceId);
        const eligible = shouldOfferPremiumAfterWin({
          platformOS: Platform.OS,
          purchasesAvailable: BillingService.purchaseUnavailableReason() == null,
          flagEnabled: isFeatureEnabled(FeatureFlags.premiumOffer, true),
          alreadyShown,
          appliedCount,
          workspace,
        });
        if (!eligible) return;

        setTimeout(() => {
          // Never stack on top of another result screen; try on the next win.
          if (visibleRef.current) return;
          void AsyncStorage.setItem(SHOWN_KEY, new Date().toISOString());
          Analytics.track("premium_offer_shown", {
            workspace_id: workspaceId,
            trigger,
          });
          show({
            variant: "info",
            image: brandAssets.premiumUpgrade,
            title: t("premiumOffer.title"),
            description: t("premiumOffer.body"),
            primaryLabel: t("premiumOffer.cta"),
            onPrimary: () => {
              Analytics.track("premium_offer_accepted", {
                workspace_id: workspaceId,
                trigger,
              });
              router.push(premiumHref("first_win"));
            },
            secondaryLabel: t("premiumOffer.later"),
            onSecondary: () => {
              Analytics.track("premium_offer_dismissed", {
                workspace_id: workspaceId,
                trigger,
              });
            },
          });
        }, OFFER_DELAY_MS);
      })();
    },
    [queryClient, show, t],
  );
}
