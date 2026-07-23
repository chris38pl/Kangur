import { forwardRef, type ComponentProps } from "react";
import type { ScrollView } from "react-native";
import { NestableScrollContainer } from "react-native-draggable-flatlist";

type Props = ComponentProps<typeof NestableScrollContainer>;

/** Native: nestable scroll for NestableDraggableFlatList. */
export const NestableScreenScroll = forwardRef<ScrollView, Props>(
  function NestableScreenScroll(props, ref) {
    return (
      <NestableScrollContainer
        ref={ref as ComponentProps<typeof NestableScrollContainer>["ref"]}
        {...props}
      />
    );
  },
);
