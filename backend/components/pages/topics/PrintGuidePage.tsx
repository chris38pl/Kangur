import { TopicPage } from "@/components/pages/TopicPage";
import { Phone } from "@/components/site/Phone";
import { Picture } from "@/components/site/Picture";
import prose from "@/components/site/prose.module.css";
import { GUIDE_PRINT, PRINT_SHEETS } from "@/lib/marketing/content/topics/guide-print";
import { GUIDES } from "@/lib/marketing/content/topics/guides";
import { homeCopy } from "@/lib/marketing/content/home";
import { PRINTABLES } from "@/lib/marketing/druk.generated";
import { SCREENS } from "@/lib/marketing/images.generated";

import styles from "./PrintGuidePage.module.css";
import topics from "./topics.module.css";

export function PrintGuidePage() {
  return (
    <TopicPage
      id="guidePrint"
      locale="pl"
      copy={GUIDE_PRINT}
      page="poradnik-druk"
      parent={{ label: GUIDES.crumb, id: "guides" }}
      tone="cream"
      sticker="z-lista"
      art={
        <div className={styles.fridge} aria-hidden>
          <Picture image={PRINTABLES.gotowa.preview} alt="" className={styles.back} priority />
          <Picture image={PRINTABLES.alejki.preview} alt="" className={styles.front} priority />
          <span className={styles.magnet} />
        </div>
      }
      slots={{
        phone: (
          <Phone
            image={SCREENS.pl.import}
            alt={homeCopy("pl").hero.screenAlt}
            className={topics.phone}
          />
        ),
      }}
    >
      <section className={prose.section}>
        <div className={prose.wrap}>
          <ul className={styles.sheets}>
            {PRINT_SHEETS.map(({ id, title, body, button }) => {
              const { href, kilobytes, preview } = PRINTABLES[id];
              return (
                <li key={id} className={styles.sheet}>
                  <a href={href} target="_blank" className={styles.preview}>
                    <Picture image={preview} alt={`Podgląd: ${title}, A4`} />
                  </a>
                  <div>
                    <h2>{title}</h2>
                    <p>{body}</p>
                    <a href={href} target="_blank" className={styles.button}>
                      {button}
                      <small>PDF, {kilobytes} KB</small>
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </TopicPage>
  );
}
