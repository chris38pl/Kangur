type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

function getClerkErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;

  const err = error as {
    errors?: { code?: string }[];
    code?: string;
  };

  return err.errors?.[0]?.code ?? err.code ?? null;
}

/**
 * Prefer i18n strings keyed by Clerk error `code`.
 * Never surface Clerk's English API messages when UI language is PL/EN.
 */
export function getClerkErrorMessage(
  error: unknown,
  t: TranslateFn,
  fallbackKey: string,
): string {
  const code = getClerkErrorCode(error);
  if (code) {
    const translated = t(`auth.errors.clerk.${code}`, {
      defaultValue: "",
    });
    if (translated) return translated;
  }

  return t(fallbackKey);
}
