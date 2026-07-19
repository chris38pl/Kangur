import type { AppLocale } from "@shared/locales";

import be from "../be.json";
import cs from "../cs.json";
import de from "../de.json";
import en from "../en.json";
import es from "../es.json";
import fr from "../fr.json";
import it from "../it.json";
import pl from "../pl.json";
import ru from "../ru.json";
import uk from "../uk.json";

/**
 * Sole place that imports locale JSON files.
 * i18n init and the rest of the app import `resources` only.
 */
export const resources: Record<
  AppLocale,
  { translation: typeof en }
> = {
  pl: { translation: pl },
  en: { translation: en },
  de: { translation: de },
  ru: { translation: ru },
  uk: { translation: uk },
  fr: { translation: fr },
  es: { translation: es },
  it: { translation: it },
  cs: { translation: cs },
  be: { translation: be },
};
