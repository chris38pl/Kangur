import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { FeedbackSheet, type FeedbackSheetProps } from "@/components/feedback-sheet";
import { brandAssets } from "@/design-system/brand-assets";

import type { Workspace } from "./schemas";
import type {
  SubscriptionProvider,
  WorkspaceRemovalFailure,
  WorkspaceRemovalMode,
} from "./workspace-removal";

const STORE_NAMES: Record<SubscriptionProvider, string> = {
  apple: "App Store",
  google: "Google Play",
  stripe: "Stripe",
};

type Props = {
  visible: boolean;
  mode: WorkspaceRemovalMode;
  workspace: Pick<Workspace, "name" | "memberCount" | "plan">;
  busy?: boolean;
  /** Set after a failed attempt; the sheet then explains why. */
  failure: WorkspaceRemovalFailure | null;
  onCancel: () => void;
  onConfirm: () => void;
  onManageSubscription: (provider: SubscriptionProvider | null) => void;
};

type SheetContent = Omit<FeedbackSheetProps, "visible" | "busy">;

function confirmContent(
  t: TFunction,
  props: Props,
): SheetContent {
  const { workspace, mode } = props;

  if (mode === "leave") {
    return {
      image: brandAssets.leaveShopping,
      title: t("workspace.leaveTitle"),
      body: t("workspace.leaveBody", { name: workspace.name }),
      primaryLabel: t("workspace.leaveConfirm"),
      onPrimary: props.onConfirm,
      secondaryLabel: t("workspace.cancel"),
      onSecondary: props.onCancel,
      primaryDestructive: true,
    };
  }

  const others = Math.max(0, workspace.memberCount - 1);
  const lead = [t("workspace.deleteBody", { name: workspace.name })];
  if (others > 0) {
    lead.push(t("workspace.deleteMembersLoseAccess", { count: others }));
  }
  const warning = [];
  if (workspace.plan === "premium") warning.push(t("workspace.deletePremiumLost"));
  warning.push(t("workspace.deleteIrreversible"));

  return {
    image: brandAssets.deleteList,
    title: t("workspace.deleteTitle"),
    body: `${lead.join(" ")}\n\n${warning.join(" ")}`,
    primaryLabel: t("workspace.deleteConfirm"),
    onPrimary: props.onConfirm,
    secondaryLabel: t("workspace.cancel"),
    onSecondary: props.onCancel,
    primaryDestructive: true,
  };
}

function subscriptionBody(
  t: TFunction,
  mode: WorkspaceRemovalMode,
  failure: Extract<WorkspaceRemovalFailure, { kind: "active_subscription" }>,
): string {
  if (mode === "delete" && !failure.billingOwnerIsYou) {
    return t("workspace.deleteBlockedOtherPayer");
  }
  const store = failure.provider ? STORE_NAMES[failure.provider] : null;
  if (mode === "delete") {
    return store
      ? t("workspace.deleteBlockedStore", { store })
      : t("workspace.deleteBlockedNoStore");
  }
  return store
    ? t("workspace.leaveBlockedStore", { store })
    : t("workspace.leaveBlockedNoStore");
}

function failureContent(
  t: TFunction,
  props: Props,
  failure: WorkspaceRemovalFailure,
): SheetContent {
  switch (failure.kind) {
    case "active_subscription": {
      // Only the person who pays can cancel; others get a plain close button.
      const canManage = failure.billingOwnerIsYou;
      return {
        image: brandAssets.premiumActive,
        title: t("workspace.removeBlockedSubscriptionTitle"),
        body: subscriptionBody(t, props.mode, failure),
        primaryLabel: canManage
          ? t("billing.manageBillingCta")
          : t("workspace.close"),
        onPrimary: canManage
          ? () => props.onManageSubscription(failure.provider)
          : props.onCancel,
        ...(canManage
          ? { secondaryLabel: t("workspace.close"), onSecondary: props.onCancel }
          : {}),
      };
    }
    case "last_workspace":
      return {
        image: brandAssets.workspaceHero,
        title: t("workspace.lastWorkspaceTitle"),
        body: t("workspace.lastWorkspaceBody"),
        primaryLabel: t("workspace.close"),
        onPrimary: props.onCancel,
      };
    case "owner_cannot_leave":
      return {
        image: brandAssets.workspaceHero,
        title: t("workspace.ownerCannotLeaveTitle"),
        body: t("workspace.ownerCannotLeaveBody"),
        primaryLabel: t("workspace.close"),
        onPrimary: props.onCancel,
      };
    case "not_found":
    case "generic":
      return {
        image: brandAssets.error,
        title: t("workspace.removeFailedTitle"),
        body:
          props.mode === "delete"
            ? t("workspace.deleteFailed")
            : t("workspace.leaveFailed"),
        primaryLabel: t("common.tryAgain"),
        onPrimary: props.onConfirm,
        secondaryLabel: t("workspace.close"),
        onSecondary: props.onCancel,
      };
  }
}

/**
 * Confirm deleting (owner) or leaving (others) a workspace, and explain a
 * refusal in place: renewing subscription, only workspace, owner leaving.
 */
export function RemoveWorkspaceSheet(props: Props) {
  const { t } = useTranslation();
  const content = props.failure
    ? failureContent(t, props, props.failure)
    : confirmContent(t, props);

  return (
    <FeedbackSheet
      visible={props.visible}
      busy={props.busy}
      imageWidth={160}
      imageHeight={150}
      {...content}
    />
  );
}
