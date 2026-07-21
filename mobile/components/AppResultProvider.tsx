import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ImageSourcePropType } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppResultScreen,
  type AppResultVariant,
} from "@/components/AppResultScreen";

export type ShowAppResultOptions = {
  variant?: AppResultVariant;
  title: string;
  description?: string;
  primaryLabel?: string;
  /** Called after dismiss when the user taps the primary CTA. */
  onPrimary?: () => void;
  /** Optional second CTA (e.g. “Go back” when primary is “Try again”). */
  secondaryLabel?: string;
  /** Called after dismiss when the user taps the secondary CTA. */
  onSecondary?: () => void;
  image?: ImageSourcePropType;
};

type AppResultContextValue = {
  /** True while the global result Modal is visible. */
  visible: boolean;
  show: (options: ShowAppResultOptions) => void;
  showError: (options: Omit<ShowAppResultOptions, "variant">) => void;
  dismiss: () => void;
};

const AppResultContext = createContext<AppResultContextValue | null>(null);

type ActiveResult = ShowAppResultOptions & {
  variant: AppResultVariant;
};

/**
 * Root-level host for {@link AppResultScreen}. Mount once near the app root
 * so errors/results stack above route Modals and can be reused app-wide.
 */
export function AppResultProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [active, setActive] = useState<ActiveResult | null>(null);

  const dismiss = useCallback(() => {
    setActive(null);
  }, []);

  const show = useCallback((options: ShowAppResultOptions) => {
    setActive({
      variant: options.variant ?? "info",
      title: options.title,
      description: options.description,
      primaryLabel: options.primaryLabel,
      onPrimary: options.onPrimary,
      secondaryLabel: options.secondaryLabel,
      onSecondary: options.onSecondary,
      image: options.image,
    });
  }, []);

  const showError = useCallback(
    (options: Omit<ShowAppResultOptions, "variant">) => {
      show({ ...options, variant: "error" });
    },
    [show],
  );

  const value = useMemo(
    () => ({
      visible: active != null,
      show,
      showError,
      dismiss,
    }),
    [active, show, showError, dismiss],
  );

  return (
    <AppResultContext.Provider value={value}>
      {children}
      <AppResultScreen
        visible={active != null}
        presentation="modal"
        variant={active?.variant ?? "error"}
        title={active?.title ?? ""}
        description={active?.description}
        primaryLabel={active?.primaryLabel ?? t("common.continue")}
        secondaryLabel={active?.secondaryLabel}
        image={active?.image}
        onPrimary={() => {
          const next = active?.onPrimary;
          dismiss();
          next?.();
        }}
        onSecondary={
          active?.secondaryLabel
            ? () => {
                const next = active?.onSecondary;
                dismiss();
                next?.();
              }
            : undefined
        }
        onBack={dismiss}
      />
    </AppResultContext.Provider>
  );
}

export function useAppResult(): AppResultContextValue {
  const ctx = useContext(AppResultContext);
  if (!ctx) {
    throw new Error("useAppResult must be used within AppResultProvider");
  }
  return ctx;
}
