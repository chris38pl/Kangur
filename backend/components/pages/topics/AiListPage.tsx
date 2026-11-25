import { TopicPage } from "@/components/pages/TopicPage";
import { Phone } from "@/components/site/Phone";
import { Sticker } from "@/components/site/Sticker";
import { AI_LIST } from "@/lib/marketing/content/topics/ai-list";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./topics.module.css";

export function AiListPage() {
  return (
    <TopicPage
      id="aiList"
      locale="pl"
      copy={AI_LIST}
      page="lista-ai"
      art={
        <Phone
          image={SCREENS.pl.ways}
          alt="Ekran Kangura z pytaniem, jak utworzyć listę: Obraz, Tekst ze schowka, Opisz listę, Z przepisu, Poprzednie listy"
          sizes="264px"
          className={styles.heroPhone}
          time="17:54"
          priority
        />
      }
      slots={{
        kangur: <Sticker name="zaklopotany" className={styles.sticker} />,
      }}
    />
  );
}
