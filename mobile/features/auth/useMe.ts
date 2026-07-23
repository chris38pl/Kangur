import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";

import { apiFetch } from "@/lib/api/client";
import i18n from "@/lib/i18n";
import { resolveAppLocale } from "@/lib/i18n/locales";
import { persistMeCache } from "@/lib/query/persist-bootstrap";
import { createEnumSchema } from "@/lib/zod-enum";
import { APP_LOCALE_IDS } from "@shared/locales";

const AppLocaleSchema = createEnumSchema(APP_LOCALE_IDS);

export const MeSchema = z.object({
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

  const query = useQuery({
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
      const parsed = MeSchema.parse(data);
      void persistMeCache(parsed);
      return parsed;
    },
  });

  // Restore persisted profile language after boot (web often starts as "en").
  // Device language remains the initial fallback until /me resolves.
  useEffect(() => {
    const profileLocale = query.data?.locale;
    if (!profileLocale) return;
    const next = resolveAppLocale(profileLocale);
    if (resolveAppLocale(i18n.language) === next) return;
    void i18n.changeLanguage(next);
  }, [query.data?.locale]);

  return query;
}
