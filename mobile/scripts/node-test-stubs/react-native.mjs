/** Minimal react-native stand-in for node tests (AppState only). */
const listeners = new Set();

export const AppState = {
  currentState: "active",
  addEventListener(_type, listener) {
    listeners.add(listener);
    return { remove: () => listeners.delete(listener) };
  },
};

/**
 * Test-only: the OS moves the app to `next` ("active", "background",
 * "inactive"). Like React Native, listeners hear only real changes.
 */
export function setAppStateForTest(next) {
  if (AppState.currentState === next) return;
  AppState.currentState = next;
  for (const listener of [...listeners]) listener(next);
}

export const Platform = { OS: "ios", select: (choices) => choices.ios };

export default { AppState, Platform };
