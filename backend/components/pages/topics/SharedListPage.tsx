import { TopicPage } from "@/components/pages/TopicPage";
import { ChatCard } from "@/components/site/ChatCard";
import { Phone } from "@/components/site/Phone";
import { homeCopy } from "@/lib/marketing/content/home";
import { AISLE_CALL, SHARED_LIST } from "@/lib/marketing/content/topics/shared-list";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./topics.module.css";

export function SharedListPage() {
  const { together } = homeCopy("pl");
  return (
    <TopicPage
      id="sharedList"
      locale="pl"
      copy={SHARED_LIST}
      page="wspolna-lista"
      sticker="z-koszykiem"
      art={
        <div className={styles.pair}>
          <Phone
            image={SCREENS.pl.sharedOla}
            alt={together.screenAlt}
            sizes="200px"
            time="17:20"
            priority
          />
          <Phone image={SCREENS.pl.sharedOla} alt="" sizes="200px" time="17:20" />
          <span className={styles.bubble}>{together.added?.[0]}</span>
        </div>
      }
      slots={{
        chat: (
          <ChatCard
            chat={AISLE_CALL}
            label="Rozmowa ze sklepu, której można uniknąć"
            className={styles.chat}
          />
        ),
      }}
    />
  );
}
