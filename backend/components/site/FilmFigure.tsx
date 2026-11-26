import Link from "next/link";

import { FilmPlayer } from "@/components/site/FilmPlayer";
import { film as findFilm, filmGroup, type FilmId } from "@/lib/marketing/films";
import { routeHref } from "@/lib/marketing/routes";
import { typesetPl } from "@/lib/marketing/typography";

import styles from "./FilmFigure.module.css";

/**
 * A film next to the text it shows: the player, that the voice is synthetic, what it says,
 * and the way to the rest of the series. Polish pages only.
 */
export function FilmFigure({ id }: { id: FilmId }) {
  const item = findFilm(id);
  const group = filmGroup(item);

  return (
    <figure className={styles.figure}>
      <FilmPlayer film={item} sizes="(max-width: 700px) 86vw, 340px" />
      <figcaption className={styles.caption}>
        <p>
          {item.name}, {item.seconds} s. Lektor: syntezator mowy.
        </p>
        <details>
          <summary>Co mówi lektor</summary>
          <p>{typesetPl(item.transcript)}</p>
        </details>
        <Link href={`${routeHref("films", "pl")}#${group.id}`} prefetch={false}>
          Więcej filmów: {group.label}
        </Link>
      </figcaption>
    </figure>
  );
}
