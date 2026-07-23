/**
 * Root tab back policy (Android hardware back).
 * Add a new Root tab here — do not sprinkle BackHandlers.
 *
 * @see docs/navigation-principles.md
 */
export const RootScreens = {
  home: { back: "exit" as const },
  history: { back: "home" as const },
  workspace: { back: "home" as const },
  profile: { back: "home" as const },
} as const;

export type RootScreenKey = keyof typeof RootScreens;

export type RootBackAction = (typeof RootScreens)[RootScreenKey]["back"];

/** Expo Router tab segment → RootScreens key */
export const ROOT_TAB_TO_KEY: Record<string, RootScreenKey> = {
  index: "home",
  history: "history",
  workspace: "workspace",
  profile: "profile",
};
