import { forwardRef } from "react";
import { ScrollView, type ScrollViewProps } from "react-native";

/** Web: plain ScrollView (NestableScrollContainer uses findNodeHandle). */
export const NestableScreenScroll = forwardRef<ScrollView, ScrollViewProps>(
  function NestableScreenScroll(props, ref) {
    return <ScrollView ref={ref} {...props} />;
  },
);
