import { TopicPage } from "@/components/pages/TopicPage";
import { Phone } from "@/components/site/Phone";
import { Sticker } from "@/components/site/Sticker";
import { WeekTable } from "@/components/site/WeekTable";
import prose from "@/components/site/prose.module.css";
import { WeekCalculator } from "@/components/tools/WeekCalculator";
import { kangurSlots } from "@/components/tools/kangur-slots";
import { homeCopy } from "@/lib/marketing/content/home";
import { TOOLS } from "@/lib/marketing/content/topics/tools";
import { WEEK_TOOL } from "@/lib/marketing/content/topics/week-tool";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./topics.module.css";

export function WeekToolPage() {
  return (
    <TopicPage
      id="weekTool"
      locale="pl"
      copy={WEEK_TOOL}
      page="narzedzie-tydzien"
      parent={{ label: TOOLS.crumb, id: "tools" }}
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
          <WeekCalculator slots={kangurSlots("hop-tydzien")} />
        </div>
      </section>
    </TopicPage>
  );
}
