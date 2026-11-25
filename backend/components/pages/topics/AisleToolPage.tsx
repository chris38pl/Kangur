import { TopicPage } from "@/components/pages/TopicPage";
import { AisleTable } from "@/components/site/AisleTable";
import { Phone } from "@/components/site/Phone";
import { PrintFoot } from "@/components/site/PrintFoot";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { AisleTool } from "@/components/tools/AisleTool";
import { buildAisleWords } from "@/lib/marketing/aisles/dictionary";
import type { Aisle } from "@/lib/marketing/aisles/labels";
import { AISLE_SAMPLE, AISLE_TOOL } from "@/lib/marketing/content/topics/aisle-tool";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./topics.module.css";

/** One string per aisle: a third smaller in the HTML than a list of pairs. */
function packWords(): Partial<Record<Aisle, string>> {
  const packed: Partial<Record<Aisle, string>> = {};
  for (const [phrase, aisle] of buildAisleWords()) {
    packed[aisle] = packed[aisle] ? `${packed[aisle]}|${phrase}` : phrase;
  }
  return packed;
}

export function AisleToolPage() {
  return (
    <TopicPage
      id="aisleTool"
      locale="pl"
      copy={AISLE_TOOL}
      page="alejki"
      printable
      sticker="z-torba"
      art={<Sticker name="z-lista" className={styles.stickerLow} priority />}
      slots={{
        aisles: <AisleTable />,
        phone: (
          <Phone
            image={SCREENS.pl.aisles}
            alt="Tryb zakupów w Kangurze: lista alejek od owoców, przy każdej liczba produktów do kupienia"
            className={styles.phone}
            time="18:12"
          />
        ),
      }}
    >
      <section className={styles.tool}>
        <div className={prose.wrap}>
          <AisleTool words={packWords()} sample={AISLE_SAMPLE}>
            <PrintFoot />
          </AisleTool>
        </div>
      </section>
    </TopicPage>
  );
}
