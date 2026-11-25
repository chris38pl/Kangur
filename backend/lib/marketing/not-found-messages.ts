import type { AppLocale } from "@shared/locales";

/** Kept apart from messages.ts: the 404 runs in the browser and must not pull all copy in. */
export const notFoundMessages: Record<
  AppLocale,
  { title: string; body: string; back: string }
> = {
  pl: {
    title: "Tej alejki tu nie ma",
    body: "Strona została przeniesiona albo nigdy jej nie było. Wróć do wejścia i weź wózek jeszcze raz.",
    back: "Na stronę główną",
  },
  en: {
    title: "There is no such aisle",
    body: "The page has moved, or it was never here. Head back to the entrance and grab a cart again.",
    back: "Back to home",
  },
  de: {
    title: "Diesen Gang gibt es hier nicht",
    body: "Die Seite wurde verschoben oder es gab sie nie. Geh zurück zum Eingang und schnapp dir noch mal einen Einkaufswagen.",
    back: "Zur Startseite",
  },
  fr: {
    title: "Ce rayon n’existe pas",
    body: "La page a été déplacée ou n’a jamais existé. Retournez à l’entrée et reprenez un chariot.",
    back: "Retour à l’accueil",
  },
  es: {
    title: "Este pasillo no existe",
    body: "La página se ha movido o nunca ha existido. Vuelve a la entrada y hazte con otro carro.",
    back: "Volver al inicio",
  },
  it: {
    title: "Questo reparto non c’è",
    body: "La pagina è stata spostata o non è mai esistita. Torna all’ingresso e riprendi il carrello.",
    back: "Torna alla home",
  },
  cs: {
    title: "Tahle ulička tu není",
    body: "Stránka byla přesunuta, nebo tu nikdy nebyla. Vrať se ke vchodu a vezmi si košík znovu.",
    back: "Zpět na úvod",
  },
  ru: {
    title: "Такого отдела здесь нет",
    body: "Страница переехала, или её никогда не было. Вернитесь ко входу и возьмите тележку ещё раз.",
    back: "На главную",
  },
  uk: {
    title: "Такого відділу тут немає",
    body: "Сторінку перенесли, або її ніколи не було. Поверніться до входу й візьміть візок ще раз.",
    back: "На головну",
  },
  be: {
    title: "Такога аддзела тут няма",
    body: "Старонку перанеслі, або яе ніколі не было. Вярніцеся да ўваходу і вазьміце вазок яшчэ раз.",
    back: "На галоўную",
  },
};
