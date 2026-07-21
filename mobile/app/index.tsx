import { Redirect } from "expo-router";

/**
 * Entry redirect only — auth is enforced in `(auth)/_layout` and `(tabs)/_layout`.
 * Do not call Clerk hooks here; Expo Router can mount this route before nested
 * providers finish wiring during Fast Refresh / cold start.
 */
export default function Index() {
  return <Redirect href={"/(tabs)" as never} />;
}
