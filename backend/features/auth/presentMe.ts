import type { User } from "@prisma/client";

import { isAppLocale } from "@/lib/locale";
import {
  isPrivateRelayEmail,
  resolveDisplayName,
} from "@/lib/names/displayName";

import { MeResponseSchema, type MeResponse } from "./schemas";

type MeUser = Pick<
  User,
  | "id"
  | "clerkId"
  | "email"
  | "locale"
  | "platformRole"
  | "displayName"
  | "createdAt"
  | "updatedAt"
>;

/** The signed-in person about themselves. Their own address stays: the app decides how to show it. */
export function presentMe(user: MeUser): MeResponse {
  return MeResponseSchema.parse({
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    locale: isAppLocale(user.locale) ? user.locale : null,
    platformRole: user.platformRole,
    displayName: resolveDisplayName(user),
    emailHidden: isPrivateRelayEmail(user.email),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
}
