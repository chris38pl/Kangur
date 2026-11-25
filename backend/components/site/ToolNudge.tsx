import { StoreButtons } from "@/components/marketing/StoreButtons";
import { Sticker } from "@/components/site/Sticker";
import { homeCopy } from "@/lib/marketing/content/home";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/marketing/site";

import styles from "./ToolNudge.module.css";

/** Right where a tool ends its work: the next thing to do, and why it takes the app. */
export function ToolNudge({
  title,
  body,
  page,
}: {
  title: string;
  body: string;
  /** Reported to the stores for visitors without a campaign. */
  page: string;
}) {
  const { hero } = homeCopy("pl");
  return (
    <aside className={styles.nudge} aria-label={title} data-noprint>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
        <StoreButtons
          appStoreUrl={APP_STORE_URL}
          playStoreUrl={PLAY_STORE_URL}
          appStoreSmall={hero.iosSmall}
          playSmall={hero.playSmall}
          page={page}
        />
      </div>
      <Sticker name="kciuki" className={styles.kangur} />
    </aside>
  );
}
