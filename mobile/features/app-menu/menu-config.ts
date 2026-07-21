import type { Href } from "expo-router";

export type PlatformRole = "USER" | "ADMIN";

export type AppMenuVisibilityContext = {
  platformRole: PlatformRole;
  isSignedIn: boolean;
};

export type AppMenuItemId =
  | "account-details"
  | "subscription"
  | "notifications"
  | "workspace"
  | "help"
  | "feedback"
  | "privacy"
  | "terms"
  | "about"
  | "platform-console";

export type AppMenuItem = {
  id: AppMenuItemId;
  labelKey: string;
  href?: Href;
  /** Placeholder until destination exists */
  stub?: boolean;
  visible: (ctx: AppMenuVisibilityContext) => boolean;
};

export type AppMenuSectionId =
  | "account"
  | "workspace"
  | "application"
  | "platform";

export type AppMenuSection = {
  id: AppMenuSectionId;
  titleKey: string;
  items: AppMenuItem[];
};

const everyone = (ctx: AppMenuVisibilityContext) => ctx.isSignedIn;
const platformAdmin = (ctx: AppMenuVisibilityContext) =>
  ctx.isSignedIn && ctx.platformRole === "ADMIN";

/**
 * Declarative App Menu: config → visibility predicate → route.
 * Append items here; avoid scattered role checks in JSX.
 */
export const APP_MENU_SECTIONS: AppMenuSection[] = [
  {
    id: "account",
    titleKey: "appMenu.sectionAccount",
    items: [
      {
        id: "account-details",
        labelKey: "appMenu.accountDetails",
        href: "/account",
        visible: everyone,
      },
      {
        id: "subscription",
        labelKey: "appMenu.subscription",
        href: "/premium",
        visible: everyone,
      },
      {
        id: "notifications",
        labelKey: "appMenu.notifications",
        href: "/notifications",
        visible: everyone,
      },
    ],
  },
  {
    id: "workspace",
    titleKey: "appMenu.sectionWorkspace",
    items: [
      {
        id: "workspace",
        labelKey: "appMenu.workspace",
        href: "/(tabs)/workspace",
        visible: everyone,
      },
    ],
  },
  {
    id: "application",
    titleKey: "appMenu.sectionApplication",
    items: [
      {
        id: "help",
        labelKey: "appMenu.help",
        href: "/help",
        visible: everyone,
      },
      {
        id: "feedback",
        labelKey: "appMenu.feedback",
        href: "/help",
        visible: everyone,
      },
      {
        id: "privacy",
        labelKey: "appMenu.privacy",
        stub: true,
        visible: everyone,
      },
      {
        id: "terms",
        labelKey: "appMenu.terms",
        stub: true,
        visible: everyone,
      },
      {
        id: "about",
        labelKey: "appMenu.about",
        href: "/about",
        visible: everyone,
      },
    ],
  },
  {
    id: "platform",
    titleKey: "appMenu.sectionPlatform",
    items: [
      {
        id: "platform-console",
        labelKey: "appMenu.platformConsole",
        href: "/platform-console",
        visible: platformAdmin,
      },
    ],
  },
];

export function visibleMenuSections(
  ctx: AppMenuVisibilityContext,
): AppMenuSection[] {
  return APP_MENU_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.visible(ctx)),
  })).filter((section) => section.items.length > 0);
}
