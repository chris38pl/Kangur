/**
 * Official profiles, checked by hand to exist. They are in the footer and in the
 * structured data (`sameAs`), so Google can tell this Kangur from the others.
 * Instagram and Facebook join the list once their pages are public.
 */
export const PROFILES: readonly { name: string; handle: string; url: string }[] = [
  {
    name: "TikTok",
    handle: "@getkangur",
    url: "https://www.tiktok.com/@getkangur",
  },
];
