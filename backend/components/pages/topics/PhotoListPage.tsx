import { TopicPage } from "@/components/pages/TopicPage";
import { Notepad } from "@/components/site/Notepad";
import { Phone } from "@/components/site/Phone";
import { Sticker } from "@/components/site/Sticker";
import { homeCopy } from "@/lib/marketing/content/home";
import { PHOTO_LIST, READINGS } from "@/lib/marketing/content/topics/photo-list";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./topics.module.css";

export function PhotoListPage() {
  const { chat, hero, ways } = homeCopy("pl");
  return (
    <TopicPage
      id="photoList"
      locale="pl"
      copy={PHOTO_LIST}
      page="lista-ze-zdjecia"
      art={
        <div className={styles.noteAndPhone}>
          <div className={styles.note}>
            <Notepad lines={ways.photo.note} locale="pl" />
          </div>
          <Phone
            image={SCREENS.pl.import}
            alt={hero.screenAlt}
            sizes="235px"
            className={styles.notePhone}
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
        ways: (
          <Phone
            image={SCREENS.pl.ways}
            alt="Ekran Kangura z pytaniem, jak utworzyć listę: Obraz, Tekst ze schowka, Opisz listę, Z przepisu, Poprzednie listy"
            className={styles.phone}
            time="17:54"
          />
        ),
        kangur: <Sticker name="smutny" className={styles.sticker} />,
      }}
    />
  );
}
