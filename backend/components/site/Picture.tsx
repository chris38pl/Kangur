import { preload } from "react-dom";

import type { MarketingImage } from "@/lib/marketing/images.generated";

type Props = {
  image: MarketingImage;
  alt: string;
  /** Required for images with several widths, e.g. "(max-width: 700px) 70vw, 300px". */
  sizes?: string;
  className?: string;
  /** The largest image above the fold: fetched first, never lazy. */
  priority?: boolean;
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
    });
  }

  return (
    <picture>
      <source type="image/avif" srcSet={image.avif} sizes={sizes} />
      <img
        src={image.src}
        alt={alt}
        width={image.width}
        height={image.height}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
      />
    </picture>
  );
}
