import { JsonLd } from "@/components/marketing/JsonLd";
import { TopicPage } from "@/components/pages/TopicPage";
import { FilmLibrary, type LibraryGroup } from "@/components/site/FilmLibrary";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { FILMS_PAGE } from "@/lib/marketing/content/topics/films";
import { FILMS, FILM_GROUPS, filmTopic } from "@/lib/marketing/films";
import { routeHref } from "@/lib/marketing/routes";
import { filmStructuredData } from "@/lib/marketing/structured-data";
import { typesetPl } from "@/lib/marketing/typography";

import styles from "./topics.module.css";

export function FilmsPage() {
  const groups: LibraryGroup[] = FILM_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    intro: typesetPl(group.intro),
    films: FILMS.filter((item) => item.part === group.part).map((item) => {
      const topic = filmTopic(item.id);
      return {
        id: item.id,
        slug: item.slug,
        title: typesetPl(item.title),
        transcript: typesetPl(item.transcript),
        seconds: item.seconds,
        src: item.src,
        width: item.width,
        height: item.height,
        poster: item.poster,
        topic: topic ? { href: routeHref(topic.id, "pl"), label: topic.label } : null,
      };
    }),
  })).filter((group) => group.films.length > 0);

  return (
    <TopicPage
      id="films"
      locale="pl"
      copy={FILMS_PAGE}
      page="filmy"
      art={<Sticker name="kciuki" className={styles.sticker} priority />}
    >
      {FILMS.map((item) => (
        <JsonLd key={item.id} data={filmStructuredData(item)} />
      ))}
      <section className={prose.section}>
        <div className={prose.wrap}>
          <FilmLibrary groups={groups} />
        </div>
      </section>
    </TopicPage>
  );
}
