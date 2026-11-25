import { preload } from "react-dom";

import type { MarketingImage } from "@/lib/marketing/images.generated";

type Props = {
  image: MarketingImage;
  alt: string;
  /** Required for images with several widths, e.g. "(max-width: 700px) 70vw, 300px". */
  sizes?: string;
  className?: string;
  /**
   * The largest thing on the first screen: fetched first, never lazy. "desktop" when it is
   * on the first screen of a computer but below the fold of a phone.
   */
  priority?: boolean | "desktop";
};

/**
 * Images are resized ahead of time (.marketing/06-seo/obrazy), with content hashes in the
 * names, so they come straight from the CDN instead of the image optimiser.
 */
export function Picture({ image, alt, sizes, className, priority }: Props) {
  if (priority) {
    preload(image.src, {
      as: "image",
      imageSrcSet: image.avif,
      imageSizes: sizes,
      type: "image/avif",
      fetchPriority: "high",
      ...(priority === "desktop" ? { media: "(min-width: 900px)" } : {}),
    });
  }
  const first = priority === true;

  return (
    <picture>
      <source type="image/avif" srcSet={image.avif} sizes={sizes} />
      <img
        src={image.src}
        alt={alt}
        width={image.width}
        height={image.height}
        className={className}
        loading={first ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={first ? "high" : undefined}
      />
    </picture>
  );
}
