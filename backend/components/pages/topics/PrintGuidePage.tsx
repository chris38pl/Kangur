import { TopicPage } from "@/components/pages/TopicPage";
import { Phone } from "@/components/site/Phone";
import { Picture } from "@/components/site/Picture";
import prose from "@/components/site/prose.module.css";
import { GUIDE_PRINT, PRINT_SHEETS } from "@/lib/marketing/content/topics/guide-print";
import { GUIDES } from "@/lib/marketing/content/topics/guides";
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
            alt="Lista ze zrzutu rozmowy w Kangurze: 22 pozycje, najpierw owoce i warzywa, potem nabiał"
            className={topics.phone}
          />
        ),
      }}
    >
      <section className={prose.section}>
        <div className={prose.wrap}>
          <nav className={styles.jump} aria-label="Szablony">
            {PRINT_SHEETS.map(({ id, short }) => (
              <a key={id} href={`#${id}`}>
                {short}
              </a>
            ))}
          </nav>
          <ul className={styles.sheets}>
            {PRINT_SHEETS.map(({ id, title, body, button, alt }) => {
              const { href, kilobytes, preview } = PRINTABLES[id];
              return (
                <li key={id} id={id} className={styles.sheet}>
                  <a href={href} target="_blank" className={styles.preview} tabIndex={-1}>
                    <Picture image={preview} alt={alt} />
                  </a>
                  <div>
                    <h2>{title}</h2>
                    <p>{body}</p>
                    <a href={href} target="_blank" className={styles.button}>
                      {button}{" "}
                      <small>
                        PDF, {kilobytes} KB<span className="visually-hidden">, nowa karta</span>
                      </small>
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
