"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  poster: string;
  width: number;
  height: number;
  /** What happens in the recording, for people who cannot see it. */
  label: string;
  className?: string;
};

/**
 * A silent recording of the real app. Nothing is downloaded until it comes into view, and
 * it stays a still picture for people who asked for less motion or less data.
 */
export function LoopVideo({ src, poster, width, height, label, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (
      connection?.saveData ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      width={width}
      height={height}
      aria-label={label}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
    />
  );
}
