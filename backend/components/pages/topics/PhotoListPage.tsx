import { TopicPage } from "@/components/pages/TopicPage";
import { Phone } from "@/components/site/Phone";
import { Sticker } from "@/components/site/Sticker";
import { homeCopy } from "@/lib/marketing/content/home";
import { HERO_MESSAGES, PHOTO_LIST, READINGS } from "@/lib/marketing/content/topics/photo-list";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./topics.module.css";

export function PhotoListPage() {
  const { chat } = homeCopy("pl");
  return (
    <TopicPage
      id="photoList"
      locale="pl"
      copy={PHOTO_LIST}
      page="lista-ze-zdjecia"
      art={
        <div className={styles.messagesAndPhone}>
          <div className={styles.messages}>
            {HERO_MESSAGES.map((index) => (
              <span key={index}>{chat.messages[index][1]}</span>
            ))}
          </div>
          <Phone
            image={SCREENS.pl.importRest}
            alt="Lista z tych wiadomości w Kangurze: chipsy cebulowe, 2 paczki, w Przekąskach i proszek do prania w Sprzątaniu"
            sizes="235px"
            className={styles.messagesPhone}
            priority
          />
        </div>
      }
      slots={{
        readings: (
          <ol className={styles.readings}>
            {READINGS.map(({ messages, verdict, note }) => (
              <li key={messages[0]}>
                <div className={styles.bubbles}>
                  {messages.map((index) => {
                    const [who, text] = chat.messages[index];
                    return (
                      <span key={index} className={who === "me" ? styles.me : undefined}>
                        {text}
                      </span>
                    );
                  })}
                </div>
                <div className={styles.verdict}>
                  <strong className={verdict === "rozmowa" ? styles.skip : undefined}>
                    {verdict}
                  </strong>
                  <p>{note}</p>
                </div>
              </li>
            ))}
          </ol>
        ),
        kangur: <Sticker name="smutny" className={styles.sticker} />,
      }}
    />
  );
}
