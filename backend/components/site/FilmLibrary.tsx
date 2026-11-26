"use client";

import Link from "next/link";
import { useState } from "react";

import { FilmPlayer } from "@/components/site/FilmPlayer";
import type { Film } from "@/lib/marketing/films";

import styles from "./FilmLibrary.module.css";

export type LibraryFilm = Pick<
  Film,
  "id" | "slug" | "title" | "transcript" | "seconds" | "src" | "width" | "height" | "poster"
> & { topic: { href: string; label: string } | null };

export type LibraryGroup = {
  id: string;
  label: string;
  intro: string;
  films: readonly LibraryFilm[];
};

/**
 * Every film of the series, part by part. The topics above hide the other parts; without
 * JavaScript all parts stay, each with its heading, and links to `#part` still land there.
 */
export function FilmLibrary({ groups }: { groups: readonly LibraryGroup[] }) {
  const [active, setActive] = useState<string | null>(null);
  const total = groups.reduce((sum, group) => sum + group.films.length, 0);
  const chosen = groups.find((group) => group.id === active);

  const choose = (id: string | null) => {
    setActive(id);
    // A film in a part that is about to hide would go on talking.
    for (const video of document.querySelectorAll("video")) if (!video.muted) video.pause();
  };

  return (
    <div className={styles.library}>
      <div className={styles.topics} role="group" aria-label="Tematy filmów">
        <button type="button" aria-pressed={active === null} onClick={() => choose(null)}>
          Wszystkie <span>{total}</span>
        </button>
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            aria-pressed={active === group.id}
            onClick={() => choose(group.id)}
          >
            {group.label} <span>{group.films.length}</span>
          </button>
        ))}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {chosen ? `${chosen.label}: ${chosen.films.length} z ${total} filmów` : ""}
      </p>

      {groups.map((group) => (
        <section
          key={group.id}
          id={group.id}
          className={styles.group}
          hidden={active !== null && active !== group.id}
          aria-labelledby={`${group.id}-title`}
        >
          <h2 id={`${group.id}-title`}>{group.label}</h2>
          <p className={styles.intro}>{group.intro}</p>
          <ul className={styles.grid}>
            {group.films.map((item) => (
              <li key={item.id} id={item.slug} className={styles.card}>
                <FilmPlayer film={item} sizes="(max-width: 700px) 86vw, 340px" />
                <h3>{item.title}</h3>
                <p className={styles.meta}>
                  {item.seconds} s
                  {item.topic ? (
                    <>
                      {" · "}
                      <Link href={item.topic.href} prefetch={false}>
                        {item.topic.label}
                      </Link>
                    </>
                  ) : null}
                </p>
                <details>
                  <summary>Co mówi lektor</summary>
                  <p>{item.transcript}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
