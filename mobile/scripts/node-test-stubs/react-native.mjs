/** Minimal react-native stand-in for node tests (AppState only). */
const listeners = new Set();

export const AppState = {
  currentState: "active",
  addEventListener(_type, listener) {
    listeners.add(listener);
    return { remove: () => listeners.delete(listener) };
  },
};

export const Platform = { OS: "ios", select: (choices) => choices.ios };

export default { AppState, Platform };
