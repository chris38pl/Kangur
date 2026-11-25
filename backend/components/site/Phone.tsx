import type { ReactNode } from "react";

import { Picture } from "@/components/site/Picture";
import type { MarketingImage } from "@/lib/marketing/images.generated";

import styles from "./Phone.module.css";

/** Status bar of a phone nobody makes: no notch, no brand, as in all Kangur graphics. */
function StatusBar({ time }: { time: string }) {
  return (
    <div className={styles.status} aria-hidden>
      <span>{time}</span>
      <svg viewBox="0 0 54 14" width="54" height="14">
        <path d="M0 13 13 1v12z" fill="currentColor" />
        <path
          d="M28 12.4 20.4 4a10.8 10.8 0 0 1 15.2 0z"
          fill="currentColor"
        />
        <rect x="44" y="2" width="8" height="11" rx="1.6" fill="currentColor" />
        <rect x="46" y="0.6" width="4" height="2" rx="0.8" fill="currentColor" />
      </svg>
    </div>
  );
}

type Props = {
  image: MarketingImage;
  /** What the screen shows, for people who cannot see it. Empty when the text nearby says it. */
  alt: string;
  time?: string;
  sizes?: string;
  priority?: boolean;
  /** Show only the upper part of the screen, for cards. */
  cropped?: boolean;
  className?: string;
  /** Drawn over the screen instead of the picture, e.g. a recording. */
  children?: ReactNode;
};

/** Real Kangur screens only. The frame is ink, never a photo of a device. */
export function Phone({
  image,
  alt,
  time = "17:55",
  sizes = "(max-width: 700px) 72vw, 300px",
  priority,
  cropped,
  className,
  children,
}: Props) {
  return (
    <div
      className={[styles.phone, cropped ? styles.cropped : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.screen}>
        {children ?? (
          <Picture
            image={image}
            alt={alt}
            sizes={sizes}
            priority={priority}
            className={styles.image}
          />
        )}
        <StatusBar time={time} />
      </div>
    </div>
  );
}
