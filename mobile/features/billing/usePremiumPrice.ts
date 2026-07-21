import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

import { getPremiumPrice } from "./api";

export function usePremiumPrice(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["premium-price"],
    enabled: Boolean(isSignedIn && enabled),
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return getPremiumPrice(token);
    },
  });
}
