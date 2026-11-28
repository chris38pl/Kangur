import { useEffect, type Dispatch, type SetStateAction } from "react";

import { peekInvitation } from "@/features/workspace/api";
import { pendingInviteToken } from "@/lib/invite/pending-invite";

/**
 * On the way to an e-mail invitation, the e-mail sign-in form starts with the address the
 * invitation went to. Never over something already typed; nothing for a link invitation.
 */
export function useInvitedEmailPrefill(setEmail: Dispatch<SetStateAction<string>>): void {
  useEffect(() => {
    const token = pendingInviteToken();
    if (!token) return;
    let alive = true;
    peekInvitation(token)
      .then((invited) => {
        if (alive && invited) setEmail((current) => (current.trim() ? current : invited));
      })
      .catch(() => {
        // Without the address the form simply starts empty.
      });
    return () => {
      alive = false;
    };
  }, [setEmail]);
}
