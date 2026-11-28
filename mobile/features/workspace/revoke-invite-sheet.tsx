import { useTranslation } from "react-i18next";

import { FeedbackSheet } from "@/components/feedback-sheet";
import { brandAssets } from "@/design-system/brand-assets";

type Props = {
  visible: boolean;
  /** "Revoke the invitation for …?" or, for a link, "nobody will join with it". */
  body: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Confirm sheet when revoking a pending workspace invitation or link.
 */
export function RevokeInviteSheet({
  visible,
  body,
  busy = false,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation();

  return (
    <FeedbackSheet
      visible={visible}
      image={brandAssets.deleteList}
      title={t("workspace.revokeInviteTitle")}
      body={body}
      primaryLabel={t("workspace.revokeInviteConfirm")}
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
