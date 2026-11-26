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

/**
 * sendInviteEmail with Resend answering `answer`, without the network: what went to
 * Resend, what came back and every log line. "no keys" is a deployment without them.
 */
async function sendWith(
  answer: Response | Error | "no keys",
  variant: "new_user" | "existing_user" = "new_user",
) {
  const saved = {
    fetch: globalThis.fetch,
    key: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };
  const sent: Record<string, unknown>[] = [];
  const logs: string[] = [];
  if (answer === "no keys") {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  } else {
    process.env.RESEND_API_KEY = "re_test_not_a_real_key";
    process.env.EMAIL_FROM = "Kangur <test@example.com>";
  }
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body)));
    if (answer instanceof Error) throw answer;
    return answer === "no keys" ? new Response(null, { status: 500 }) : answer;
  }) as typeof fetch;
  const record = (...args: unknown[]) => {
    logs.push(JSON.stringify(args));
  };
  console.info = record;
  console.warn = record;
  console.error = record;
  try {
    const result = await sendInviteEmail({
      to: "domownik@example.com",
      inviterName: "Ola",
      workspaceName: "Dom",
      workspaceIcon: "home",
      rawToken: TOKEN,
      variant,
      locale: "pl",
    });
    return { result, sent, logs };
  } finally {
    globalThis.fetch = saved.fetch;
    console.info = saved.info;
    console.warn = saved.warn;
    console.error = saved.error;
    for (const [name, value] of [
      ["RESEND_API_KEY", saved.key],
      ["EMAIL_FROM", saved.from],
    ] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("an e-mail Resend takes carries the page link and the neutral copy", async () => {
  const { result, sent, logs } = await sendWith(json(200, { id: "test" }), "existing_user");
  assert.deepEqual(result, { delivered: true });
  assert.equal(sent.length, 1);
  const html = String(sent[0].html);
  assert.ok(html.includes(`href="${SITE_URL}/invite#t=${TOKEN}"`), html);
  assert.ok(html.includes("Ola zaprasza Cię do"), html);
  assert.ok(html.includes("Otwórz zaproszenie"), html);
  assert.ok(logs.some((line) => line.includes("InviteEmailSent")));
});

test("an e-mail Resend refuses is not reported as sent", async () => {
  const { result, logs } = await sendWith(
    json(403, {
      statusCode: 403,
      name: "validation_error",
      message: "The example.com domain is not verified.",
    }),
  );
  assert.deepEqual(result, { delivered: false });
  assert.ok(logs.some((line) => line.includes("InviteEmailFailed") && line.includes("not verified")));
  assert.ok(!logs.some((line) => line.includes("InviteEmailSent")));
});

test("no connection to Resend is not reported as sent", async () => {
  const { result, logs } = await sendWith(new TypeError("fetch failed"));
  assert.deepEqual(result, { delivered: false });
  assert.ok(logs.some((line) => line.includes("InviteEmailFailed")));
});

test("without the keys nothing is sent, and the log says why", async () => {
  const { result, sent, logs } = await sendWith("no keys");
  assert.deepEqual(result, { delivered: false });
  assert.equal(sent.length, 0);
  assert.ok(logs.some((line) => line.includes("InviteEmailSkipped") && line.includes("RESEND_API_KEY")));
});

test("the token never reaches the logs, whatever Resend answers", async () => {
  const answers = [
    json(200, { id: "test" }),
    json(422, { statusCode: 422, name: "validation_error", message: "Invalid `to` field." }),
    new TypeError("fetch failed"),
    "no keys" as const,
  ];
  for (const answer of answers) {
    const { logs } = await sendWith(answer);
    assert.ok(logs.length > 0);
    for (const line of logs) assert.ok(!line.includes(TOKEN), line);
  }
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
