import { useTranslation } from "react-i18next";

import { FeedbackSheet } from "@/components/feedback-sheet";
import { brandAssets } from "@/design-system/brand-assets";

type Props = {
  visible: boolean;
  name: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Confirm sheet when removing a workspace member (MVP: no role UI).
 */
export function RemoveMemberSheet({
  visible,
  name,
  busy = false,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation();

  return (
    <FeedbackSheet
      visible={visible}
      image={brandAssets.deleteList}
      title={t("workspace.removeMemberTitle")}
      body={t("workspace.removeMemberBody", { name })}
      primaryLabel={t("workspace.removeMember")}
      onPrimary={onConfirm}
      secondaryLabel={t("workspace.cancel")}
      onSecondary={onCancel}
      primaryDestructive
      busy={busy}
      imageWidth={200}
      imageHeight={200}
    />
  );
}
