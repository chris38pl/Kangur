import Link from "next/link";

import { StoreButtons } from "@/components/marketing/StoreButtons";
import { Picture } from "@/components/site/Picture";
import { Sticker } from "@/components/site/Sticker";
import type { KangurSlots } from "@/components/tools/ToKangur";
import { homeCopy } from "@/lib/marketing/content/home";
import { HANDOFF } from "@/lib/marketing/content/topics/handoff";
import { SCREENS } from "@/lib/marketing/images.generated";
import { routeHref } from "@/lib/marketing/routes";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/marketing/site";

import styles from "./ToKangur.module.css";

const SIZES = "(max-width: 899px) 86vw, 480px";

/** The parts of ToKangur that do not change with the list. `page` is reported to the stores. */
export function kangurSlots(page: string): KangurSlots {
  const { hero } = homeCopy("pl");
  return {
    kangur: <Sticker name="kciuki" className={styles.kangur} />,
    quick: (
      <Picture image={SCREENS.pl.startQuick} alt={HANDOFF.open.alt} sizes={SIZES} className={styles.screen} />
    ),
    space: (
      <Picture image={SCREENS.pl.startSpace} alt={HANDOFF.invite.alt} sizes={SIZES} className={styles.screen} />
    ),
    stores: (
      <StoreButtons
        appStoreUrl={APP_STORE_URL}
        playStoreUrl={PLAY_STORE_URL}
        appStoreSmall={hero.iosSmall}
        playSmall={hero.playSmall}
        page={page}
      />
    ),
    link: <Link href={routeHref("sharedList", "pl")}>{HANDOFF.invite.link}</Link>,
  };
}
