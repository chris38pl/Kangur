import { Picture } from "@/components/site/Picture";
import { STICKERS } from "@/lib/marketing/images.generated";

export type StickerName = keyof typeof STICKERS;

/**
 * Drawn Kangur, our hero, as a paper cut-out. Decorative by default: the pose repeats what
 * the text says. His face and the app's text are never covered.
 */
export function Sticker({
  name,
  className,
  alt = "",
  priority,
}: {
  name: StickerName;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <Picture
      image={STICKERS[name]}
      alt={alt}
      className={className}
      priority={priority}
    />
  );
}
