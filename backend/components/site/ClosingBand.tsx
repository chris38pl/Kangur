import { StoreButtons } from "@/components/marketing/StoreButtons";
import { QrCode } from "@/components/site/QrCode";
import { Sticker, type StickerName } from "@/components/site/Sticker";
import { homeCopy } from "@/lib/marketing/content/home";
import type { AppLocale } from "@/lib/marketing/locale";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/marketing/site";

import styles from "./ClosingBand.module.css";

/** The end of every page: our slogan, both stores, and a code to scan from a computer. */
export function ClosingBand({
  locale,
  page,
  sticker = "z-torba",
  lines,
  body,
}: {
  locale: AppLocale;
  /** Reported to the stores for visitors without a campaign. */
  page: string;
  sticker?: StickerName;
  lines?: readonly [string, string];
  body?: string;
}) {
  const { closing, hero } = homeCopy(locale);
  const [first, second] = lines ?? closing.lines;
  const long = Math.max(first.length, second.length) > 16;

  return (
    <section className={styles.band}>
      <div className={styles.grid}>
        <div className={styles.copy}>
          <p className={long ? `${styles.slogan} ${styles.long}` : styles.slogan}>
            <span>{first}</span> <span>{second}</span>
          </p>
          <p className={styles.body}>{body ?? closing.body}</p>
          <StoreButtons
            appStoreUrl={APP_STORE_URL}
            playStoreUrl={PLAY_STORE_URL}
            appStoreSmall={hero.iosSmall}
            playSmall={hero.playSmall}
            page={page}
          />
        </div>
        <div className={styles.qr}>
          <QrCode label={closing.qrLabel} />
          <p>{closing.qrHint}</p>
        </div>
        <Sticker name={sticker} className={styles.kangur} />
      </div>
    </section>
  );
}
