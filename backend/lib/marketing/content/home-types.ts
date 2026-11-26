import type { Chat } from "@/components/site/ChatCard";
import type { ReceiptLine } from "@/components/site/Receipt";
import type { MarketingRouteId } from "@/lib/marketing/routes";

export type Lines = readonly [string, string];

/** Plain strings; links and bold use the marks of rich-text.tsx. */
export type HomeCopy = {
  hero: {
    /** Says what Kangur is, inside the h1. */
    eyebrow: string;
    lines: Lines;
    lead: string;
    storesNote: string;
    playSmall: string;
    iosSmall: string;
    chatLabel: string;
    screenAlt: string;
  };
  /** The conversation from film F01, translated the way people really type. */
  chat: Chat;
  steps: {
    lines: Lines;
    items: readonly [Step, Step, Step];
    /** What the recording (Polish) or the screen shows. */
    screenAlt: string;
  };
  ways: {
    lines: Lines;
    intro: string;
    photo: Card & { note: readonly string[] };
    dish: Card & { screenAlt: string };
    usual: Card & { screenAlt: string };
    typed: Card & { chips: readonly string[] };
  };
  together: {
    lines: Lines;
    body: string;
    points: readonly string[];
    fact?: { text: string; source: string; href: string };
    screenAlt: string;
    /** Notes next to the phones: where the two products came from. Polish has a real pair of screens. */
    added?: readonly [string, string];
  };
  summary: { lines: Lines; body: string; screenAlt: string };
  price: {
    lines: Lines;
    body: string;
    receiptLabel: string;
    receipt: readonly ReceiptLine[];
    link: string;
  };
  maker: {
    lines: Lines;
    body: string;
    points: readonly Card[];
    safetyLink: string;
    aboutLink: string;
  };
  faq: { lines: Lines; items: readonly { q: string; a: string }[] };
  closing: { lines: Lines; body: string; qrLabel: string; qrHint: string };
  /** Links to pages that only some languages have. */
  more?: Partial<
    Record<
      | "photoList"
      | "recipeList"
      | "weekTool"
      | "aisleTool"
      | "aiList"
      | "sharedList",
      string
    >
  >;
  /** A strip for a few weeks of the year. */
  season?: {
    id: MarketingRouteId;
    /** Hidden after this day, also before the next deploy. */
    until: string;
    lines: Lines;
    body: string;
    link: string;
  };
};

export type Step = { pill: string; title: string; body: string };
export type Card = { title: string; body: string };
