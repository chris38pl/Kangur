import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

import sitemap from "@/app/sitemap";
import { buildInviteAcceptUrl, sendInviteEmail } from "@/lib/email/sendInviteEmail";
import { t } from "@/lib/i18n";
import { generateInviteRawToken, isValidInviteRawToken } from "@/lib/invite/token";
import {
  APP_INVITE_BASE,
  INVITE_STORAGE_KEY,
  TAKE_INVITE_EARLY,
  appInviteBase,
  appInviteLink,
  isInviteToken,
  readInviteHash,
} from "@/lib/marketing/invite";
import { APP_LOCALE_IDS } from "@/lib/marketing/locale";
import { ROUTES, routeHref } from "@/lib/marketing/routes";
import { decideMarketingRoute } from "@/lib/marketing/routing";
import { buildMarketingMetadata, hreflangAlternates } from "@/lib/marketing/seo";
import { SITE_URL } from "@/lib/marketing/site";

const TOKEN = generateInviteRawToken();

/** With INVITE_ACCEPT_URL_BASE as a deployment has it, then as it was. */
function withBase<T>(value: string | undefined, run: () => T): T {
  const before = process.env.INVITE_ACCEPT_URL_BASE;
  if (value === undefined) delete process.env.INVITE_ACCEPT_URL_BASE;
  else process.env.INVITE_ACCEPT_URL_BASE = value;
  try {
    return run();
  } finally {
    if (before === undefined) delete process.env.INVITE_ACCEPT_URL_BASE;
    else process.env.INVITE_ACCEPT_URL_BASE = before;
  }
}

test("the e-mail leads to a page on the site, the token only after #", () => {
  const url = new URL(buildInviteAcceptUrl(TOKEN, "pl"));
  assert.equal(url.origin, SITE_URL);
  assert.equal(url.pathname, "/invite");
  assert.equal(url.search, "");
  assert.equal(url.hash, `#t=${TOKEN}`);
  // Browsers never send what follows "#": no server, log or Referer gets the token.
  assert.ok(!(url.origin + url.pathname + url.search).includes(TOKEN));
});

test("the page speaks the language of the e-mail", () => {
  const path = (locale: string | null) => new URL(buildInviteAcceptUrl(TOKEN, locale)).pathname;
  assert.equal(path("pl-PL"), "/invite");
  assert.equal(path("de"), "/de/invite");
  assert.equal(path("uk_UA"), "/uk/invite");
  // Unknown or missing: English, like the text of the e-mail (lib/i18n.ts).
  assert.equal(path(null), "/en/invite");
  assert.equal(path("sv"), "/en/invite");
});

test("the e-mail does not guess whether a man or a woman invites", () => {
  for (const locale of APP_LOCALE_IDS) {
    const headline = t(locale, "email.invite.headline", { inviter: "Ola" });
    // "pozval(a)", "пригласил(а)" or a masculine verb: the present tense needs neither.
    assert.doesNotMatch(
      headline,
      /\(\p{L}{1,2}\)|zaprosił|pozval|пригласил|запросив|запрасіў|invité|invitato/u,
      locale,
    );
  }
});

test("the variable set on Vercel does not bring back a link that opens nothing", () => {
  for (const base of ["kangur://invite", "kangur-dev://invite", "https://example.com/x", undefined]) {
    const link = withBase(base, () => buildInviteAcceptUrl(TOKEN, "pl"));
    assert.equal(link, `${SITE_URL}/invite#t=${TOKEN}`, String(base));
  }
});

test("the button opens the link the app has always opened", () => {
  // Old e-mails carry kangur://invite/<token>; mobile/app/invite/[token].tsx reads it.
  assert.equal(appInviteLink(appInviteBase(undefined), TOKEN), `kangur://invite/${TOKEN}`);
  assert.equal(appInviteBase("kangur://invite"), "kangur://invite");
  assert.equal(appInviteBase(" kangur-dev://invite/ "), "kangur-dev://invite");
  for (const other of [
    "",
    "https://www.getkangur.com/invite",
    "javascript://invite",
    "kangur://premium",
    "kangur://invite/x",
    "evil-kangur://invite",
  ]) {
    assert.equal(appInviteBase(other), APP_INVITE_BASE, other);
  }
});

test("the page and the server agree on what a token is", () => {
  const samples = [
    TOKEN,
    generateInviteRawToken(),
    "a".repeat(43),
    "a".repeat(42),
    "a".repeat(44),
    `${"a".repeat(42)}=`,
    `${"a".repeat(42)}.`,
    `${"a".repeat(42)}/`,
    "",
  ];
  for (const sample of samples) {
    assert.equal(isInviteToken(sample), isValidInviteRawToken(sample), sample);
  }
  assert.equal(isInviteToken(undefined), false);
});

test("only an invitation is read from the address", () => {
  assert.equal(readInviteHash(`#t=${TOKEN}`), TOKEN);
  for (const hash of ["", "#tresc", "#pobierz", `#k=${TOKEN}`, "#t=", "#t=short", `#t=${TOKEN}x`]) {
    assert.equal(readInviteHash(hash), null, hash);
  }
});

/** The early script in a browser of its own: what it leaves in the address and in storage. */
function runEarly(href: string, storage: "works" | "throws" = "works") {
  const url = new URL(href);
  const stored = new Map<string, string>();
  const addresses: string[] = [];
  const window: { __kangurInvite?: string } = {};
  vm.runInNewContext(TAKE_INVITE_EARLY, {
    window,
    location: { hash: url.hash, pathname: url.pathname, search: url.search },
    history: {
      state: { kept: true },
      replaceState: (state: unknown, _title: string, address: string) => {
        assert.deepEqual(state, { kept: true });
        addresses.push(address);
      },
    },
    sessionStorage: {
      setItem: (key: string, value: string) => {
        if (storage === "throws") throw new Error("SecurityError");
        stored.set(key, value);
      },
    },
  });
  return { addresses, stored: stored.get(INVITE_STORAGE_KEY), early: window.__kangurInvite };
}

test("the token leaves the address before Next.js or anything else reads it", () => {
  assert.deepEqual(runEarly(`https://www.getkangur.com/invite?utm_source=x#t=${TOKEN}`), {
    addresses: ["/invite?utm_source=x"],
    stored: TOKEN,
    early: TOKEN,
  });
  assert.deepEqual(runEarly(`https://www.getkangur.com/de/invite#t=${TOKEN}`).addresses, ["/de/invite"]);
  // Without sessionStorage the visit still has it.
  assert.deepEqual(runEarly(`https://www.getkangur.com/invite#t=${TOKEN}`, "throws"), {
    addresses: ["/invite"],
    stored: undefined,
    early: TOKEN,
  });
});

test("the early script leaves other pages and other anchors alone", () => {
  const untouched = { addresses: [], stored: undefined, early: undefined };
  for (const href of [
    `https://www.getkangur.com/faq#t=${TOKEN}`,
    `https://www.getkangur.com/lista-zakupow-na-tydzien#t=${TOKEN}`,
    "https://www.getkangur.com/invite#tresc",
    "https://www.getkangur.com/invite#t=short",
    "https://www.getkangur.com/invite",
  ]) {
    assert.deepEqual(runEarly(href), untouched, href);
  }
});

test("the token never reaches the logs, also when no e-mail goes out", async () => {
  const lines: string[] = [];
  const info = console.info;
  const key = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  console.info = (...args: unknown[]) => {
    lines.push(JSON.stringify(args));
  };
  try {
    const result = await sendInviteEmail({
      to: "domownik@example.com",
      inviterName: "Ola",
      workspaceName: "Dom",
      workspaceIcon: "home",
      rawToken: TOKEN,
      variant: "new_user",
      locale: "pl",
    });
    assert.deepEqual(result, { delivered: false });
  } finally {
    console.info = info;
    if (key !== undefined) process.env.RESEND_API_KEY = key;
  }
  assert.ok(lines.length > 0);
  for (const line of lines) assert.ok(!line.includes(TOKEN), line);
});

test("the invitation follows the reader's language and stays out of search", () => {
  assert.equal(ROUTES.invite.noindex, true);
  for (const locale of APP_LOCALE_IDS) {
    assert.ok(routeHref("invite", locale).endsWith("/invite"), locale);
  }

  // The browser keeps "#t=..." across this redirect, so the token goes along.
  assert.deepEqual(
    decideMarketingRoute({ pathname: "/invite", acceptLanguage: "de-DE,de;q=0.9" }),
    { kind: "redirect", path: "/de/invite", status: 307 },
  );
  assert.deepEqual(decideMarketingRoute({ pathname: "/invite" }), {
    kind: "rewrite",
    path: "/pl/invite",
  });
  assert.deepEqual(decideMarketingRoute({ pathname: "/en/invite" }), { kind: "next" });

  const meta = buildMarketingMetadata("invite", "pl");
  assert.deepEqual(meta.robots, { index: false, follow: false });
  assert.equal(meta.alternates, undefined);
  assert.equal(hreflangAlternates("invite"), undefined);
  assert.ok(!sitemap().some((entry) => entry.url.includes("/invite")));
});
