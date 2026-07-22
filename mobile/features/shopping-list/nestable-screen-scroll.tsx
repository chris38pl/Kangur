import { ScrollView, type ScrollViewProps } from "react-native";

/** Web: plain ScrollView (NestableScrollContainer uses findNodeHandle). */
export function NestableScreenScroll(props: ScrollViewProps) {
  return <ScrollView {...props} />;
}
