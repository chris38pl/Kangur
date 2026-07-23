import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";

import { hydrateQueryCacheFromStorage } from "./persist-bootstrap";

export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void hydrateQueryCacheFromStorage(client).finally(() => {
      if (!cancelled) setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [client]);

  // Brand splash covers boot — wait for AsyncStorage hydrate so warm cache paints.
  if (!hydrated) {
    return null;
  }

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
