"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./LoopVideo.module.css";

type Props = {
  src: string;
  poster: string;
  width: number;
  height: number;
  /** What happens in the recording, for people who cannot see it. */
  label: string;
  /** Names of the button that stops and starts it. */
  pauseLabel: string;
  playLabel: string;
  className?: string;
};

/**
 * A silent recording of the real app. Nothing is downloaded until it comes near, and it
 * stays a still picture for people who asked for less motion or less data. The button sits
 * in the empty middle of the status bar, so it covers nothing of the app.
 */
export function LoopVideo({
  src,
  poster,
  width,
  height,
  label,
  pauseLabel,
  playLabel,
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const calm =
      connection?.saveData ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const mount = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        mount.disconnect();
      },
      { rootMargin: "300px" },
    );
    mount.observe(root);

    const play = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (!entry.isIntersecting) video.pause();
        else if (!calm && video.dataset.stopped !== "true") {
          void video.play().catch(() => {});
        }
      },
      { threshold: 0.35 },
    );
    play.observe(root);

    return () => {
      mount.disconnect();
      play.disconnect();
    };
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setStopped(false);
      void video.play().catch(() => {});
    } else {
      setStopped(true);
      video.pause();
    }
  };

  return (
    <div ref={rootRef} className={styles.root}>
      {near ? (
        <>
          <video
            ref={videoRef}
            className={className}
            src={src}
            poster={poster}
            width={width}
            height={height}
            aria-label={label}
            data-stopped={stopped}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
          />
          <button
            type="button"
            className={styles.toggle}
            aria-label={playing ? pauseLabel : playLabel}
            onClick={toggle}
          >
            <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden>
              <path
                d={playing ? "M2 1h3v10H2zM7 1h3v10H7z" : "M2.5 1v10l8-5z"}
                fill="currentColor"
              />
            </svg>
          </button>
        </>
      ) : (
        // A plain image: the poster of the recording, loaded only when it comes near.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={className}
          src={poster}
          width={width}
          height={height}
          alt={label}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
