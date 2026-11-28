import { useState } from "react";

/**
 * A number that grows each time a sheet opens. Used as the `key` of its content, the sheet
 * starts fresh on every opening and still slides out with its last content on closing.
 * Adjusts state while rendering, the way React documents for a prop that changed.
 */
export function useOpenSession(visible: boolean): number {
  const [state, setState] = useState({ visible, session: visible ? 1 : 0 });
  if (state.visible !== visible) {
    const next = { visible, session: visible ? state.session + 1 : state.session };
    setState(next);
    return next.session;
  }
  return state.session;
}
