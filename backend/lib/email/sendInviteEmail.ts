import { getWorkspaceIconEmoji } from "@shared/workspace-icons";
import { Resend } from "resend";

import { t } from "@/lib/i18n";

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

function buildInviteAcceptUrl(rawToken: string): string {
  const base =
    process.env.INVITE_ACCEPT_URL_BASE?.trim() || "kangur://invite";
  return `${base.replace(/\/$/, "")}/${rawToken}`;
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
 * Sends invite email via Resend when RESEND_API_KEY is set.
 * Otherwise logs the accept URL (dev) and returns { delivered: false }.
 */
export async function sendInviteEmail(
  input: Omit<SendInviteEmailInput, "acceptUrl"> & { rawToken: string },
): Promise<{ delivered: boolean; acceptUrl: string }> {
  const acceptUrl = buildInviteAcceptUrl(input.rawToken);
  const payload: SendInviteEmailInput = { ...input, acceptUrl };

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    console.info("[invite]", "InviteEmailSkipped", {
      to: input.to,
      acceptUrl,
      variant: input.variant,
    });
    return { delivered: false, acceptUrl };
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: input.to,
    subject: subject(input.locale, input.workspaceName),
    html: htmlBody(payload),
  });

  console.info("[invite]", "InviteEmailSent", {
    to: input.to,
    variant: input.variant,
  });

  return { delivered: true, acceptUrl };
}
