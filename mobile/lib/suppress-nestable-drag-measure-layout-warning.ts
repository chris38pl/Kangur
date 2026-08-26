import { LogBox } from "react-native";

/**
 * NestableDraggableFlatList (react-native-draggable-flatlist) calls
 * measureLayout with findNodeHandle(node), which newer RN rejects.
 * Drag still works; Metro prints it as ERROR Warning — silence in __DEV__.
 */
const MEASURE_LAYOUT_MSG =
  "ref.measureLayout must be called with a ref to a native component";

export function suppressNestableDragMeasureLayoutWarning(): void {
  if (!__DEV__) return;

  LogBox.ignoreLogs([MEASURE_LAYOUT_MSG]);

  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === "string" && first.includes(MEASURE_LAYOUT_MSG)) {
      return;
    }
    originalError(...args);
  };
}
