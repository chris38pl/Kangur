import { getWorkspaceIconEmoji } from "@shared/workspace-icons";
import { Resend } from "resend";

import { t } from "@/lib/i18n";
import { resolveAppLocale } from "@/lib/locale";
import { invitePageUrl } from "@/lib/marketing/invite";

export type InviteEmailVariant = "new_user" | "existing_user";

export type SendInviteEmailInput = {
  to: string;
  inviterName: string;
  workspaceName: string;
  workspaceIcon: string;
  acceptUrl: string;
  variant: InviteEmailVariant;
  locale?: string | null;
};

/**
 * The invitation page of the site, in the language of the e-mail. It works without the app,
 * and its button opens the app link older e-mails carried (kangur://invite/<token>, from
 * INVITE_ACCEPT_URL_BASE). The token goes after "#", so no server or log ever sees it.
 */
function buildInviteAcceptUrl(
  rawToken: string,
  locale?: string | null,
): string {
  return invitePageUrl(resolveAppLocale(locale), rawToken);
}

export { buildInviteAcceptUrl };

function subject(locale: string | null | undefined, workspaceName: string) {
  return t(locale, "email.invite.subject", { workspaceName });
}

function htmlBody(input: SendInviteEmailInput): string {
  const emoji =
    getWorkspaceIconEmoji(input.workspaceIcon) ?? input.workspaceIcon ?? "🏠";
  const locale = input.locale;
  const cta =
    input.variant === "existing_user"
      ? t(locale, "email.invite.ctaOpen")
      : t(locale, "email.invite.ctaJoin");
  const headline = t(locale, "email.invite.headline", {
    inviter: escapeHtml(input.inviterName),
  });
  const body =
    input.variant === "existing_user"
      ? t(locale, "email.invite.bodyExisting")
      : t(locale, "email.invite.bodyNew");
  const expiry = t(locale, "email.invite.expiry");

  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1a1a1a;">
  <p>${headline}</p>
  <p style="font-size: 22px; font-weight: 700;">${emoji} ${escapeHtml(input.workspaceName)}</p>
  <p>${body}</p>
  <p><a href="${escapeHtml(input.acceptUrl)}" style="display:inline-block;padding:12px 20px;background:#2F8F84;color:#fff;text-decoration:none;border-radius:8px;">${cta}</a></p>
  <p style="color:#666;font-size:13px;">${expiry}</p>
</body>
</html>`.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends the invitation e-mail through Resend. `delivered` is false when nothing went out:
 * RESEND_API_KEY or EMAIL_FROM is missing, or Resend refused the e-mail. Resend answers
 * with an error instead of throwing, so it has to be read. The invitation itself stays and
 * can be sent again. Never logs acceptUrl / raw token (invite hygiene).
 */
export async function sendInviteEmail(
  input: Omit<SendInviteEmailInput, "acceptUrl"> & { rawToken: string },
): Promise<{ delivered: boolean }> {
  const acceptUrl = buildInviteAcceptUrl(input.rawToken, input.locale);
  const payload: SendInviteEmailInput = { ...input, acceptUrl };

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    // Expected on a laptop, a broken invitation everywhere else.
    console.warn("[invite]", "InviteEmailSkipped", {
      to: input.to,
      variant: input.variant,
      reason: "RESEND_API_KEY or EMAIL_FROM is not set",
    });
    return { delivered: false };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: subject(input.locale, input.workspaceName),
    html: htmlBody(payload),
  });

  if (error) {
    // "The getkangur.com domain is not verified" and the like: what to fix, no token.
    console.error("[invite]", "InviteEmailFailed", {
      to: input.to,
      variant: input.variant,
      error: {
        name: error.name,
        statusCode: error.statusCode,
        message: error.message,
      },
    });
    return { delivered: false };
  }

  console.info("[invite]", "InviteEmailSent", {
    to: input.to,
    variant: input.variant,
  });

  return { delivered: true };
}
