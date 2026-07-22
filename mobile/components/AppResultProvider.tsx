import { router } from "expo-router";
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
import { InsufficientCreditsScreen } from "@/components/InsufficientCreditsScreen";
import type { CreditShortage } from "@/lib/ai/insufficientCredits";

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

export type ShowInsufficientCreditsOptions = CreditShortage & {
  /** Override default body copy for a specific AI action. */
  description?: string;
  /** Called after dismiss when the user taps Premium (default: /premium). */
  onPremium?: () => void;
  /** Called after dismiss when the user taps back. */
  onBack?: () => void;
};

type AppResultContextValue = {
  /** True while the global result Modal is visible. */
  visible: boolean;
  show: (options: ShowAppResultOptions) => void;
  showError: (options: Omit<ShowAppResultOptions, "variant">) => void;
  showInsufficientCredits: (options: ShowInsufficientCreditsOptions) => void;
  dismiss: () => void;
};

const AppResultContext = createContext<AppResultContextValue | null>(null);

type ActiveResult = ShowAppResultOptions & {
  variant: AppResultVariant;
};

type ActiveInsufficientCredits = ShowInsufficientCreditsOptions;

/**
 * Root-level host for {@link AppResultScreen} and
 * {@link InsufficientCreditsScreen}. Mount once near the app root so
 * errors/results stack above route Modals and can be reused app-wide.
 */
export function AppResultProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [active, setActive] = useState<ActiveResult | null>(null);
  const [creditsGate, setCreditsGate] =
    useState<ActiveInsufficientCredits | null>(null);

  const dismiss = useCallback(() => {
    setActive(null);
    setCreditsGate(null);
  }, []);

  const show = useCallback((options: ShowAppResultOptions) => {
    setCreditsGate(null);
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

  const showInsufficientCredits = useCallback(
    (options: ShowInsufficientCreditsOptions) => {
      setActive(null);
      setCreditsGate(options);
    },
    [],
  );

  const value = useMemo(
    () => ({
      visible: active != null || creditsGate != null,
      show,
      showError,
      showInsufficientCredits,
      dismiss,
    }),
    [active, creditsGate, show, showError, showInsufficientCredits, dismiss],
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
      <InsufficientCreditsScreen
        visible={creditsGate != null}
        needed={creditsGate?.needed ?? 0}
        remaining={creditsGate?.remaining ?? 0}
        description={creditsGate?.description}
        onPremium={() => {
          const next = creditsGate?.onPremium;
          dismiss();
          if (next) {
            next();
          } else {
            router.push("/premium");
          }
        }}
        onBack={() => {
          const next = creditsGate?.onBack;
          dismiss();
          next?.();
        }}
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
