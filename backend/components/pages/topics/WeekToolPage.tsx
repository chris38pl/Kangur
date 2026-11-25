import { TopicPage } from "@/components/pages/TopicPage";
import { Phone } from "@/components/site/Phone";
import { PrintFoot } from "@/components/site/PrintFoot";
import { Sticker } from "@/components/site/Sticker";
import { ToolNudge } from "@/components/site/ToolNudge";
import { WeekTable } from "@/components/site/WeekTable";
import prose from "@/components/site/prose.module.css";
import { WeekCalculator } from "@/components/tools/WeekCalculator";
import { homeCopy } from "@/lib/marketing/content/home";
import { WEEK_TOOL, WEEK_NUDGE } from "@/lib/marketing/content/topics/week-tool";
import { TOOLS } from "@/lib/marketing/content/topics/tools";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./topics.module.css";

export function WeekToolPage() {
  return (
    <TopicPage
      id="weekTool"
      locale="pl"
      copy={WEEK_TOOL}
      page="poradnik-tydzien"
      parent={{ label: TOOLS.crumb, id: "tools" }}
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
