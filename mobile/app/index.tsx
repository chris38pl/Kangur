import { Redirect } from "expo-router";
import { useEffect } from "react";

import { bootLog } from "@/lib/boot-diagnostics";

/**
 * Entry redirect only — auth is enforced in `(auth)/_layout` and `(tabs)/_layout`.
 * Do not call Clerk hooks here; Expo Router can mount this route before nested
 * providers finish wiring during Fast Refresh / cold start.
 */
export default function Index() {
  useEffect(() => {
    bootLog("index_route", "app/index.tsx mounted → Redirect /(tabs)");
  }, []);

  return <Redirect href={"/(tabs)" as never} />;
}
