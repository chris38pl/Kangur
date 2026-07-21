import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import { brand, colors, shadows, typography } from "@/design-system/tokens";

import {
  TabIconArchive,
  TabIconHome,
  TabIconLists,
  TabIconPlus,
  TabIconProfile,
} from "./tab-icons";

const FAB_SIZE = 56;

type TabsTabBarProps = NonNullable<
  ComponentProps<typeof Tabs>["tabBar"]
> extends (props: infer P) => unknown
  ? P
  : never;

type Props = TabsTabBarProps & {
  onCreatePress: () => void;
};

function iconForRoute(name: string, color: string, focused: boolean) {
  switch (name) {
    case "index":
      return <TabIconHome color={color} filled={focused} />;
    case "workspace":
      return <TabIconLists color={color} />;
    case "history":
      return <TabIconArchive color={color} />;
    case "profile":
      return <TabIconProfile color={color} />;
    default:
      return null;
  }
}

/**
 * Kangur bottom bar - four tabs with a docked center FAB (create list).
 * Layout: Home | Spaces | [+] | Lists | Profile
 */
export function KangurTabBar({
  state,
  descriptors,
  navigation,
  onCreatePress,
}: Props) {
  const scheme = useColorScheme() ?? "light";
  const theme = colors[scheme];
  const insets = useSafeAreaInsets();
  const padBottom = Math.max(insets.bottom, 8);

  const left = state.routes.slice(0, 2);
  const right = state.routes.slice(2);

  const renderTab = (route: (typeof state.routes)[number]) => {
    const index = state.routes.findIndex((r) => r.key === route.key);
    const { options } = descriptors[route.key];
    const label =
      typeof options.tabBarLabel === "string"
        ? options.tabBarLabel
        : typeof options.title === "string"
          ? options.title
          : route.name;
    const focused = state.index === index;
    const color = focused ? theme.primary : theme.textMuted;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
        onPress={onPress}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 6,
          gap: 3,
          minHeight: 48,
        }}
      >
        {iconForRoute(route.name, color, focused)}
        <Text
          style={{
            ...typography.caption,
            fontSize: 11,
            lineHeight: 14,
            fontWeight: focused ? "600" : "500",
            color,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: theme.bg,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingBottom: padBottom,
        paddingTop: 4,
        minHeight: 56 + padBottom,
        ...shadows.soft,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        elevation: 8,
      }}
    >
      {left.map(renderTab)}

      <View
        style={{
          width: FAB_SIZE + 16,
          alignItems: "center",
          justifyContent: "flex-start",
          marginTop: -22,
        }}
      >
        <Pressable
          onPress={onCreatePress}
          accessibilityRole="button"
          accessibilityLabel="Create shopping list"
          style={{
            width: FAB_SIZE,
            height: FAB_SIZE,
            borderRadius: FAB_SIZE / 2,
            backgroundColor: brand.primary,
            alignItems: "center",
            justifyContent: "center",
            ...shadows.fab,
          }}
        >
          <TabIconPlus color="#fff" size={28} />
        </Pressable>
      </View>

      {right.map(renderTab)}
    </View>
  );
}
