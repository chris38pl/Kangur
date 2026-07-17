import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import * as Localization from "expo-localization";
import { z } from "zod";

import { apiFetch } from "@/lib/api/client";

const MeSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  locale: z.enum(["pl", "en"]).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MeUser = z.infer<typeof MeSchema>;

function deviceLocale(): string {
  const code = Localization.getLocales()[0]?.languageCode ?? "en";
  return code.startsWith("pl") ? "pl" : "en";
}

export function useMe(enabled = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["me"],
    enabled: enabled && Boolean(isSignedIn),
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing Clerk token");
      }
      const data = await apiFetch<unknown>("/api/v1/me", {
        token,
        deviceLocale: deviceLocale(),
      });
      return MeSchema.parse(data);
    },
  });
}
