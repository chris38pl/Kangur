import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { apiFetch } from "@/lib/api/client";
import i18n from "@/lib/i18n";
import { resolveAppLocale } from "@/lib/i18n/locales";
import { createEnumSchema } from "@/lib/zod-enum";
import { APP_LOCALE_IDS } from "@shared/locales";

const AppLocaleSchema = createEnumSchema(APP_LOCALE_IDS);

const MeSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  locale: AppLocaleSchema.nullable(),
  platformRole: z.enum(["USER", "ADMIN"]).default("USER"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MeUser = z.infer<typeof MeSchema>;

function preferredLocale(): string {
  return resolveAppLocale(i18n.language);
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
        deviceLocale: preferredLocale(),
      });
      return MeSchema.parse(data);
    },
  });
}
