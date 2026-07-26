export type ChangeType =
  | "feature"
  | "improvement"
  | "fix"
  | "security"
  | "breaking";

/** Release body languages shipped in MVP JSON. */
export type ReleaseLocale = "pl" | "en";

export type LocalizedString = Record<ReleaseLocale, string>;

export type ReleaseChange = {
  type: ChangeType;
  text: LocalizedString;
};

export type ReleaseNotes = {
  version: string;
  /** ISO date YYYY-MM-DD — format at render time, never store display strings. */
  releaseDate: string;
  /** Optional emphasis for history UI (e.g. major milestone). */
  highlight?: boolean;
  title?: LocalizedString;
  changes: ReleaseChange[];
};
