import { useEffect } from "react";

import { WelcomeScreen } from "@/features/auth/welcome-screen";
import { clearPendingInvite } from "@/lib/invite/pending-invite";

export default function AuthWelcomeRoute() {
  useEffect(() => {
    // Back on the welcome screen: the person left the invitation's sign-in. A later,
    // ordinary sign-in leads Home, not to that invitation.
    clearPendingInvite();
  }, []);

  return <WelcomeScreen />;
}
