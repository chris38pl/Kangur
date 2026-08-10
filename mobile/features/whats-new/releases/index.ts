import type { ReleaseNotes } from "../types";

import v100 from "./1.0.0.json";
import v101 from "./1.0.1.json";
import v102 from "./1.0.2.json";
import v103 from "./1.0.3.json";

/**
 * Explicit Metro registry. Adding a release = new JSON + one import line here.
 * Do not edit UI components when shipping notes.
 */
export const RELEASE_NOTES_RAW: ReleaseNotes[] = [
  v100 as ReleaseNotes,
  v101 as ReleaseNotes,
  v102 as ReleaseNotes,
  v103 as ReleaseNotes,
];
