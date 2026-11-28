import { z } from "zod";

/**
 * A list where one row the app cannot read is skipped instead of breaking the whole list.
 * App 1.0.8 lost its notification list over one unknown type; from 1.0.9 a newer server can
 * add things without breaking older apps.
 */
export function lenientArray<T extends z.ZodType>(item: T) {
  return z.array(z.unknown()).transform((rows) =>
    rows.flatMap((row) => {
      const parsed = item.safeParse(row);
      return parsed.success ? [parsed.data as z.output<T>] : [];
    }),
  );
}
