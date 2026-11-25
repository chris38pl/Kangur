import { TopicPage } from "@/components/pages/TopicPage";
import { Phone } from "@/components/site/Phone";
import { DishTable } from "@/components/site/DishTable";
import { AfterSeason } from "@/components/site/Season";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { ChristmasCalculator } from "@/components/tools/ChristmasCalculator";
import { kangurSlots } from "@/components/tools/kangur-slots";
import { CHRISTMAS_TOOL } from "@/lib/marketing/content/topics/christmas-tool";
import { TOOLS } from "@/lib/marketing/content/topics/tools";
import { SHARED_SCREEN_ALT } from "@/lib/marketing/content/topics/shared-list";
import { SCREENS } from "@/lib/marketing/images.generated";
import { isOver } from "@/lib/marketing/season";
import { CHRISTMAS } from "@/lib/marketing/lists/christmas";

import styles from "./topics.module.css";

export function ChristmasToolPage() {
  const over = (
    <p className={styles.over}>
      Święta {CHRISTMAS.year} za nami. Daty poprawimy przed następnymi, ilości zostają te same.
    </p>
  );
  return (
    <TopicPage
      id="christmasTool"
      locale="pl"
      copy={CHRISTMAS_TOOL}
      page="narzedzie-wigilia"
      parent={{ label: TOOLS.crumb, id: "tools" }}
      tone="peach"
      sticker="z-koszykiem"
      art={<Sticker name="z-torba" className={`${styles.stickerLow} ${styles.toolArt}`} priority />}
      slots={{
        dishes: <DishTable />,
        kangur: <Sticker name="medytacja" className={styles.sticker} />,
        phones: (
          <div className={styles.duo}>
            <Phone image={SCREENS.pl.quick} alt={SHARED_SCREEN_ALT} sizes="200px" time="17:20" />
            <Phone image={SCREENS.pl.quick} alt="" sizes="200px" time="17:20" />
          </div>
        ),
      }}
    >
      <section className={styles.tool}>
        <div className={prose.wrap}>
          {isOver(CHRISTMAS.over) ? over : <AfterSeason after={CHRISTMAS.over}>{over}</AfterSeason>}
          <ChristmasCalculator slots={kangurSlots("do-kangura-wigilia")} />
        </div>
      </section>
    </TopicPage>
  );
}
