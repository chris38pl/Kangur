import { TopicPage } from "@/components/pages/TopicPage";
import { Phone } from "@/components/site/Phone";
import { PrintFoot } from "@/components/site/PrintFoot";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { ChristmasCalculator } from "@/components/tools/ChristmasCalculator";
import { GUIDE_CHRISTMAS } from "@/lib/marketing/content/topics/guide-christmas";
import { GUIDES } from "@/lib/marketing/content/topics/guides";
import { homeCopy } from "@/lib/marketing/content/home";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./topics.module.css";

export function ChristmasGuidePage() {
  return (
    <TopicPage
      id="guideChristmas"
      locale="pl"
      copy={GUIDE_CHRISTMAS}
      page="poradnik-swieta"
      parent={{ label: GUIDES.crumb, id: "guides" }}
      tone="peach"
      printable
      sticker="z-koszykiem"
      art={<Sticker name="z-torba" className={styles.stickerLow} priority />}
      slots={{
        kangur: <Sticker name="medytacja" className={styles.sticker} />,
        phones: (
          <div className={styles.duo}>
            <Phone
              image={SCREENS.pl.sharedOla}
              alt={homeCopy("pl").together.screenAlt}
              sizes="200px"
              time="17:20"
            />
            <Phone image={SCREENS.pl.sharedOla} alt="" sizes="200px" time="17:20" />
          </div>
        ),
      }}
    >
      <section className={styles.tool}>
        <div className={prose.wrap}>
          <ChristmasCalculator>
            <PrintFoot />
          </ChristmasCalculator>
        </div>
      </section>
    </TopicPage>
  );
}
