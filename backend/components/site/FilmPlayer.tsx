"use client";

import { useRef, useState } from "react";

import { Picture } from "@/components/site/Picture";
import type { Film } from "@/lib/marketing/films";

import styles from "./FilmPlayer.module.css";

type Props = {
  film: Pick<Film, "title" | "seconds" | "src" | "width" | "height" | "poster">;
  /** Width of the player, e.g. "(max-width: 700px) 86vw, 340px". */
  sizes: string;
  className?: string;
};

/**
 * A narrated film of the real app, in Polish like every page that has one. The page holds
 * only the cover: the film has a voice, so it starts on a tap, is fetched then, and plays
 * where it stands. Starting one stops any other film with sound.
 */
export function FilmPlayer({ film, sizes, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const coverRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<"cover" | "loading" | "playing">("cover");

  const start = () => {
    const video = videoRef.current;
    if (!video) return;
    setState("loading");
    // Called right in the tap, so even Safari plays it with sound. If a browser still
    // refuses, the cover goes and its own controls take over.
    video.play().catch(() => setState("playing"));
  };

  return (
    <div className={[styles.player, className ?? ""].filter(Boolean).join(" ")}>
      <video
        ref={videoRef}
        className={styles.video}
        src={film.src}
        width={film.width}
        height={film.height}
        preload="none"
        playsInline
        controls={state === "playing"}
        tabIndex={state === "playing" ? 0 : -1}
        // Until it plays, the cover is the one thing to press.
        aria-hidden={state === "playing" ? undefined : true}
        aria-label={`Film: ${film.title}`}
        onPlay={(event) => {
          for (const other of document.querySelectorAll("video")) {
            if (other !== event.currentTarget && !other.paused && !other.muted) other.pause();
          }
        }}
        onPlaying={(event) => {
          if (state === "playing") return;
          const focused = coverRef.current === document.activeElement;
          setState("playing");
          if (focused) event.currentTarget.focus();
        }}
      />
      {state === "playing" ? null : (
        <button
          ref={coverRef}
          type="button"
          className={styles.cover}
          onClick={start}
          aria-label={`Odtwórz film: ${film.title}, ${film.seconds} s`}
          aria-busy={state === "loading"}
        >
          <Picture image={film.poster} alt="" sizes={sizes} className={styles.poster} />
          <span className={state === "loading" ? `${styles.play} ${styles.loading}` : styles.play} aria-hidden>
            <svg viewBox="0 0 24 24" width="30" height="30">
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
          </span>
          <span className={styles.time} aria-hidden>
            {film.seconds} s
          </span>
        </button>
      )}
    </div>
  );
}
