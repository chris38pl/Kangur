import { createContext, useContext, type ReactNode } from "react";

const NestableScreenScrollContext = createContext(false);

export function NestableScreenScrollProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <NestableScreenScrollContext.Provider value={true}>
      {children}
    </NestableScreenScrollContext.Provider>
  );
}

/** True when rendered inside native NestableScreenScroll (NestableScrollContainer). */
export function useNestableScreenScroll(): boolean {
  return useContext(NestableScreenScrollContext);
}
