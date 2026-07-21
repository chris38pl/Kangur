import { useAuth } from "@clerk/clerk-expo";
import * as SplashScreen from "expo-splash-screen";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { BrandedBootSplash } from "@/components/BrandedBootSplash";

const MIN_MS = 850;
const MAX_MS = 1500;
const CONTENT_FADE_MS = 260;

/** Once per JS process - warm navigation must never re-show the brand splash. */
let coldStartSplashConsumed = false;

type StartupPhase = "enter" | "exit" | "done";

type AppStartupContextValue = {
  /** Call when signed-in home (or equivalent) is ready to reveal. */
  notifyBootReady: () => void;
  /** True while brand overlay is covering content (enter + exit). */
  isBrandSplashActive: boolean;
};

const AppStartupContext = createContext<AppStartupContextValue | null>(null);

export function useAppStartup(): AppStartupContextValue {
  const ctx = useContext(AppStartupContext);
  if (!ctx) {
    return {
      notifyBootReady: () => {},
      isBrandSplashActive: false,
    };
  }
  return ctx;
}

type Props = { children: ReactNode };

/**
 * Orchestrates cold-start brand boot. Covers loading - never invents waiting
 * beyond the min aesthetic window. Future: onboarding / maintenance / force-update.
 */
export function AppStartupController({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth();
  const [phase, setPhase] = useState<StartupPhase>(() =>
    coldStartSplashConsumed ? "done" : "enter",
  );
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const bootReadyRef = useRef(false);
  const startedAtRef = useRef(Date.now());
  const exitRequestedRef = useRef(false);
  const contentOpacity = useSharedValue(phase === "done" ? 1 : 0);

  const requestExit = useCallback(() => {
    if (exitRequestedRef.current) return;
    if (phaseRef.current !== "enter") return;

    const elapsed = Date.now() - startedAtRef.current;
    const minOk = elapsed >= MIN_MS;
    const maxHit = elapsed >= MAX_MS;
    if (!(maxHit || (bootReadyRef.current && minOk))) return;

    exitRequestedRef.current = true;
    setPhase("exit");
    contentOpacity.value = withTiming(1, {
      duration: CONTENT_FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [contentOpacity]);

  const notifyBootReady = useCallback(() => {
    bootReadyRef.current = true;
    requestExit();
  }, [requestExit]);

  // Hide native splash as soon as branded overlay (or app) is up - do not wait for Clerk.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  // Timers: try exit at min and hard-cap at max.
  useEffect(() => {
    if (phase !== "enter") return;
    const tMin = setTimeout(() => requestExit(), MIN_MS);
    const tMax = setTimeout(() => requestExit(), MAX_MS);
    return () => {
      clearTimeout(tMin);
      clearTimeout(tMax);
    };
  }, [phase, requestExit]);

  // Signed-out: boot is ready once Clerk loaded (auth screens under overlay).
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      notifyBootReady();
    }
  }, [isLoaded, isSignedIn, notifyBootReady]);

  const onExitComplete = useCallback(() => {
    coldStartSplashConsumed = true;
    setPhase("done");
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: contentOpacity.value,
  }));

  const value = useMemo(
    () => ({
      notifyBootReady,
      isBrandSplashActive: phase === "enter" || phase === "exit",
    }),
    [notifyBootReady, phase],
  );

  const showSplash = phase === "enter" || phase === "exit";

  return (
    <AppStartupContext.Provider value={value}>
      <View style={styles.root}>
        <Animated.View style={contentStyle}>{children}</Animated.View>
        {showSplash ? (
          <BrandedBootSplash
            exiting={phase === "exit"}
            onExitComplete={onExitComplete}
          />
        ) : null}
      </View>
    </AppStartupContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
