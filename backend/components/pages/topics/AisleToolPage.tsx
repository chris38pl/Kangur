import { TopicPage } from "@/components/pages/TopicPage";
import { AisleTable } from "@/components/site/AisleTable";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { AisleTool } from "@/components/tools/AisleTool";
import { kangurSlots } from "@/components/tools/kangur-slots";
import { buildAisleWords } from "@/lib/marketing/aisles/dictionary";
import type { Aisle } from "@/lib/marketing/aisles/labels";
import { AISLE_SAMPLE, AISLE_TOOL } from "@/lib/marketing/content/topics/aisle-tool";
import { TOOLS } from "@/lib/marketing/content/topics/tools";

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
      page="narzedzie-alejki"
      parent={{ label: TOOLS.crumb, id: "tools" }}
      sticker="z-torba"
      art={<Sticker name="z-lista" className={`${styles.stickerLow} ${styles.toolArt}`} priority />}
      slots={{
        aisles: <AisleTable />,
      }}
    >
      <section className={styles.tool}>
        <div className={prose.wrap}>
          <AisleTool words={packWords()} sample={AISLE_SAMPLE} slots={kangurSlots("do-kangura-alejki")} />
        </div>
      </section>
    </TopicPage>
  );
}
