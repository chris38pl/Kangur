import { NestableScrollContainer } from "react-native-draggable-flatlist";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof NestableScrollContainer>;

/** Native: nestable scroll for NestableDraggableFlatList. */
export function NestableScreenScroll(props: Props) {
  return <NestableScrollContainer {...props} />;
}
