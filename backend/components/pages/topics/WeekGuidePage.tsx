import { TopicPage } from "@/components/pages/TopicPage";
import { Phone } from "@/components/site/Phone";
import { PrintFoot } from "@/components/site/PrintFoot";
import { Sticker } from "@/components/site/Sticker";
import { ToolNudge } from "@/components/site/ToolNudge";
import { WeekTable } from "@/components/site/WeekTable";
import prose from "@/components/site/prose.module.css";
import { WeekCalculator } from "@/components/tools/WeekCalculator";
import { homeCopy } from "@/lib/marketing/content/home";
import { GUIDE_WEEK, WEEK_NUDGE } from "@/lib/marketing/content/topics/guide-week";
import { GUIDES } from "@/lib/marketing/content/topics/guides";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./topics.module.css";

export function WeekGuidePage() {
  return (
    <TopicPage
      id="guideWeek"
      locale="pl"
      copy={GUIDE_WEEK}
      page="poradnik-tydzien"
      parent={{ label: GUIDES.crumb, id: "guides" }}
      printable
      sticker="lezak"
      art={<Sticker name="z-koszykiem" className={`${styles.stickerStanding} ${styles.toolArt}`} priority />}
      slots={{
        table: <WeekTable />,
        kangur: <Sticker name="skron" className={styles.sticker} />,
        history: (
          <Phone
            image={SCREENS.pl.history}
            alt={homeCopy("pl").ways.usual.screenAlt}
            className={styles.phone}
            time="9:15"
          />
        ),
      }}
    >
      <section className={styles.tool}>
        <div className={prose.wrap}>
          <WeekCalculator
            code={<PrintFoot />}
            nudge={<ToolNudge {...WEEK_NUDGE} page="kalkulator-tydzien" />}
          />
        </div>
      </section>
    </TopicPage>
  );
}
