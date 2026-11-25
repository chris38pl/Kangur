import { TopicPage } from "@/components/pages/TopicPage";
import { Phone } from "@/components/site/Phone";
import { Sticker } from "@/components/site/Sticker";
import { homeCopy } from "@/lib/marketing/content/home";
import { AI_HERO_MESSAGE, AI_LIST } from "@/lib/marketing/content/topics/ai-list";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./topics.module.css";

export function AiListPage() {
  const { chat } = homeCopy("pl");
  return (
    <TopicPage
      id="aiList"
      locale="pl"
      copy={AI_LIST}
      page="lista-ai"
      art={
        <div className={styles.aiHero}>
          <p className={styles.skipped}>
            {chat.messages[AI_HERO_MESSAGE][1]} <small>to nie produkt</small>
          </p>
          <Phone
            image={SCREENS.pl.importDone}
            alt="Lista z rozmowy w Kangurze, posortowana według alejek, i potwierdzenie: Dodano 22 produkty"
            sizes="240px"
            className={styles.heroPhone}
            time="17:54"
            priority
          />
        </div>
      }
      slots={{
        kangur: <Sticker name="zaklopotany" className={styles.sticker} />,
      }}
    />
  );
}
