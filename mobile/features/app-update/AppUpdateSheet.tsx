import { useTranslation } from "react-i18next";

import { FeedbackSheet } from "@/components/feedback-sheet";
import { brandAssets } from "@/design-system/brand-assets";

export type AppUpdateSheetVariant = "soft" | "force";

type Props = {
  visible: boolean;
  /** MVP: only soft is shown. Force reserved for a later milestone. */
  variant?: AppUpdateSheetVariant;
  onUpdate: () => void;
  onLater: () => void;
};

/**
 * Soft (and future force) update prompt. Update = primary; Later = text CTA.
 */
export function AppUpdateSheet({
  visible,
  variant = "soft",
  onUpdate,
  onLater,
}: Props) {
  const { t } = useTranslation();

  // Force UI (blocking, no Later) lands in a later milestone.
  const isSoft = variant === "soft";

  return (
    <FeedbackSheet
      visible={visible}
      image={brandAssets.appUpdate}
      title={t("appUpdate.title")}
      body={t("appUpdate.body")}
      primaryLabel={t("appUpdate.update")}
      onPrimary={onUpdate}
      secondaryLabel={isSoft ? t("appUpdate.later") : undefined}
      onSecondary={isSoft ? onLater : undefined}
      imageWidth={200}
      imageHeight={200}
    />
  );
}
