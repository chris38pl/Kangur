import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import { colors } from "@/design-system/tokens";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const scheme = useColorScheme() ?? "light";

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors[scheme].bg,
        }}
      >
        <ActivityIndicator color={colors[scheme].primary} />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}
