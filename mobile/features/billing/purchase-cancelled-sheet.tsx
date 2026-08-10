import { useTranslation } from "react-i18next";

import { FeedbackSheet } from "@/components/feedback-sheet";
import { brandAssets } from "@/design-system/brand-assets";

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * User dismissed Play / store purchase sheet — branded feedback, not a raw Alert.
 */
export function PurchaseCancelledSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <FeedbackSheet
      visible={visible}
      image={brandAssets.premiumUpgrade}
      title={t("billing.purchaseCancelledTitle")}
      body={t("billing.purchaseCancelledBody")}
      primaryLabel={t("common.back")}
      onPrimary={onClose}
      imageWidth={200}
      imageHeight={200}
    />
  );
}
