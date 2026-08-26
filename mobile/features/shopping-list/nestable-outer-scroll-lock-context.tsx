import { createContext, useContext } from "react";

export type NestableOuterScrollLock = {
  lockOuterScroll: () => void;
  unlockOuterScroll: () => void;
};

export const NestableOuterScrollLockContext =
  createContext<NestableOuterScrollLock | null>(null);

/** Locks the outer NestableScreenScroll while dragging nested lists (native only). */
export function useNestableOuterScrollLock(): NestableOuterScrollLock | null {
  return useContext(NestableOuterScrollLockContext);
}
