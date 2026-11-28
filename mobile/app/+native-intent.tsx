import { inviteTokenFromUrl } from "@/lib/invite/invite-url";

/**
 * Links that open the app from outside. An invitation link of the site (the code on the
 * inviter's screen, a shared link, the e-mail) goes straight to "Join"; the old
 * kangur://invite/<token> links already have their route. Everything else stays as it is.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const token = inviteTokenFromUrl(path);
    if (token) return `/invite/${token}`;
  } catch {
    // A link we cannot read opens the app where it would have anyway.
  }
  return path;
}
