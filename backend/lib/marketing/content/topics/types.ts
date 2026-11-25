import type { Lines } from "@/lib/marketing/content/home-types";
import type { MarketingRouteId } from "@/lib/marketing/routes";

export type Tone = "white" | "tinted" | "cream" | "mint";

type Card = { title: string; body: string };

type Base = { title?: string; intro?: string; outro?: string; tone?: Tone };

/** What a content page is made of. Pictures come from the page itself, by `slot`. */
export type TopicSection = Base &
  (
    | {
        kind: "text";
        body: readonly string[];
        list?: readonly string[];
        /** Name of the picture on the right (left when `flip`). */
        slot?: string;
        flip?: boolean;
      }
    | { kind: "steps"; items: readonly Card[]; slot?: string }
    | { kind: "cards"; items: readonly Card[]; columns?: 2 | 3 | 4 }
    | {
        kind: "table";
        caption: string;
        head: readonly string[];
        rows: readonly (readonly string[])[];
        /** The last column is ours, so it gets a tint. */
        highlight?: boolean;
        /** On a phone every row is a card, so that words do not break in half. */
        stack?: boolean;
      }
    | { kind: "fact"; text: string; source: string; href: string }
    | { kind: "custom"; slot: string }
    | { kind: "faq"; items: readonly { q: string; a: string }[] }
  );

export type TopicCopy = {
  crumb: string;
  eyebrow: string;
  lines: Lines;
  lead: readonly string[];
  /** Store buttons on the first screen, with this line below them. Not on tools. */
  stores?: string;
  sections: readonly TopicSection[];
  related: {
    title: string;
    items: readonly { id: MarketingRouteId; label: string; body: string }[];
  };
  closing?: { lines: Lines; body: string };
  /** Who publishes the guide, as of when, and how to quote it. */
  imprint?: string;
};
