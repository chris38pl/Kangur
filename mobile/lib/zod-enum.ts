import { z } from "zod";

/**
 * Zod enum from a readonly string array without call-site tuple casts.
 */
export function createEnumSchema<T extends string>(
  values: readonly T[],
): z.ZodEnum<{ [K in T]: K }> {
  if (values.length === 0) {
    throw new Error("createEnumSchema requires at least one value");
  }
  const [first, ...rest] = values as [T, ...T[]];
  return z.enum([first, ...rest]);
}
