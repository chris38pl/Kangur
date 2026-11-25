import { TopicPage } from "@/components/pages/TopicPage";
import { ChatCard } from "@/components/site/ChatCard";
import { Phone } from "@/components/site/Phone";
import {
  AISLE_CALL,
  SHARED_LIST,
  SHARED_NOTE,
  SHARED_SCREEN_ALT,
} from "@/lib/marketing/content/topics/shared-list";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./topics.module.css";

export function SharedListPage() {
  return (
    <TopicPage
      id="sharedList"
      locale="pl"
      copy={SHARED_LIST}
      page="wspolna-lista"
      sticker="z-koszykiem"
      art={
        <div className={styles.pair}>
          <Phone image={SCREENS.pl.quick} alt={SHARED_SCREEN_ALT} sizes="200px" time="17:20" priority />
          <Phone image={SCREENS.pl.quick} alt="" sizes="200px" time="17:20" />
          <span className={styles.bubble}>{SHARED_NOTE}</span>
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
