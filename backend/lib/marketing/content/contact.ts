import type { Lines } from "@/lib/marketing/content/home-types";
import { LEGAL_ENTITY } from "@/lib/marketing/legal-entity";
import type { AppLocale } from "@/lib/marketing/locale";
import { typesetCopy } from "@/lib/marketing/typography";

type Row = { term: string; value: string };

export type ContactCopy = {
  lines: Lines;
  lead: string;
  rows: readonly Row[];
  shortcutsTitle: string;
  shortcuts: readonly { title: string; body: string }[];
};

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "contact@getkangur.com";
const MAIL = `[[mailto:${CONTACT_EMAIL}|${CONTACT_EMAIL}]]`;
const { firmName, nip, regon } = LEGAL_ENTITY;

const COPY: Record<AppLocale, ContactCopy> = {
  pl: {
    lines: ["Napisz.", "Odpisze człowiek."],
    lead: "Kangura robi jedna osoba, więc nie ma tu formularza, infolinii ani numerka w kolejce. Jest skrzynka i ktoś, kto ją czyta.",
    rows: [
      { term: "E-mail", value: MAIL },
      { term: "Odpowiedź", value: "zwykle w ciągu dwóch dni" },
      { term: "Z aplikacji", value: "menu, „Opinia”, a tam „Zgłoś problem” albo „Mam pomysł”" },
      { term: "Telefon", value: "infolinii nie mamy. Jeśli ktoś dzwoni „z Kangura”, to nie my. [[safety|Jak nas rozpoznać]]" },
      { term: "Firma", value: `${firmName}, NIP ${nip}, REGON ${regon}, Poznań` },
    ],
    shortcutsTitle: "Na skróty",
    shortcuts: [
      { title: "Premium", body: "Cena, rezygnacja i pierwszy miesiąc: [[pricing|cennik]]." },
      { title: "Konto", body: "Usuniesz je w aplikacji, bez pisania do nas: [[deleteAccount|usunięcie konta]]." },
      { title: "Jak to działa", body: "Zrzuty, alejki, zaproszenia, brak zasięgu: [[faq|pytania i odpowiedzi]]." },
    ],
  },
  en: {
    lines: ["Write to us.", "A person writes back."],
    lead: "Kangur is made by one person, so there is no form, no hotline and no ticket number. There is an inbox and somebody who reads it.",
    rows: [
      { term: "Email", value: MAIL },
      { term: "Reply", value: "usually within two days" },
      { term: "From the app", value: "menu, “Feedback”, then “Report a problem” or “I have an idea”" },
      { term: "Phone", value: "we have no hotline. If somebody calls “from Kangur”, it is not us. [[safety|How to recognize us]]" },
      { term: "Company", value: `${firmName}, NIP ${nip}, Poznań, Poland` },
    ],
    shortcutsTitle: "Shortcuts",
    shortcuts: [
      { title: "Premium", body: "Price, canceling and the first month: [[pricing|pricing]]." },
      { title: "Account", body: "You can delete it in the app, without writing to us: [[deleteAccount|deleting your account]]." },
      { title: "How it works", body: "Screenshots, aisles, invitations, no signal: [[faq|questions and answers]]." },
    ],
  },
  de: {
    lines: ["Schreib uns.", "Ein Mensch antwortet."],
    lead: "Hinter Kangur steckt eine einzige Person. Es gibt also kein Formular, keine Hotline und keine Wartenummer, sondern ein Postfach und jemanden, der es liest.",
    rows: [
      { term: "E-Mail", value: MAIL },
      { term: "Antwort", value: "meist innerhalb von zwei Tagen" },
      { term: "In der App", value: "Menü, „Feedback“, dann „Problem melden“ oder „Ich habe eine Idee“" },
      { term: "Telefon", value: "eine Hotline haben wir nicht. Ruft jemand „von Kangur“ an, sind das nicht wir. [[safety|So erkennst du uns (Englisch)]]" },
      { term: "Firma", value: `${firmName}, NIP ${nip}, Poznań, Polen` },
    ],
    shortcutsTitle: "Abkürzungen",
    shortcuts: [
      { title: "Premium", body: "Preis, Kündigung und der erste Monat: [[pricing|Preise (Englisch)]]." },
      { title: "Konto", body: "Du löschst es in der App, ohne uns zu schreiben: [[deleteAccount|Konto löschen]]." },
      { title: "So funktioniert’s", body: "Screenshots, Gänge, Einladungen, kein Empfang: [[faq|Fragen und Antworten (Englisch)]]." },
    ],
  },
  fr: {
    lines: ["Écrivez-nous.", "Quelqu’un vous répond."],
    lead: "Kangur est fait par une seule personne : pas de formulaire, pas de standard, pas de ticket d’attente. Juste une boîte mail et quelqu’un qui la lit.",
    rows: [
      { term: "E-mail", value: MAIL },
      { term: "Réponse", value: "en général sous deux jours" },
      { term: "Dans l’appli", value: "menu, « Commentaires », puis « Signaler un problème » ou « J’ai une idée »" },
      { term: "Téléphone", value: "nous n’avons pas de standard. Si quelqu’un appelle « de la part de Kangur », ce n’est pas nous. [[safety|Comment nous reconnaître (en anglais)]]" },
      { term: "Entreprise", value: `${firmName}, NIP ${nip}, Poznań, Pologne` },
    ],
    shortcutsTitle: "Raccourcis",
    shortcuts: [
      { title: "Premium", body: "Prix, résiliation et premier mois : [[pricing|tarifs (en anglais)]]." },
      { title: "Compte", body: "Il se supprime dans l’appli, sans nous écrire : [[deleteAccount|supprimer le compte]]." },
      { title: "Comment ça marche", body: "Captures, rayons, invitations, pas de réseau : [[faq|questions et réponses (en anglais)]]." },
    ],
  },
  es: {
    lines: ["Escríbenos.", "Responde una persona."],
    lead: "Kangur lo hace una sola persona, así que aquí no hay formulario, ni centralita, ni número de turno. Hay un buzón y alguien que lo lee.",
    rows: [
      { term: "Correo", value: MAIL },
      { term: "Respuesta", value: "normalmente en dos días" },
      { term: "Desde la app", value: "menú, «Comentarios», y allí «Informar de un problema» o «Tengo una idea»" },
      { term: "Teléfono", value: "no tenemos centralita. Si alguien llama «de parte de Kangur», no somos nosotros. [[safety|Cómo reconocernos (en inglés)]]" },
      { term: "Empresa", value: `${firmName}, NIP ${nip}, Poznań, Polonia` },
    ],
    shortcutsTitle: "Atajos",
    shortcuts: [
      { title: "Premium", body: "Precio, cancelación y primer mes: [[pricing|precios (en inglés)]]." },
      { title: "Cuenta", body: "Se elimina en la app, sin escribirnos: [[deleteAccount|eliminar la cuenta]]." },
      { title: "Cómo funciona", body: "Capturas, pasillos, invitaciones, sin cobertura: [[faq|preguntas y respuestas (en inglés)]]." },
    ],
  },
  it: {
    lines: ["Scrivici.", "Risponde una persona."],
    lead: "Kangur lo fa una persona sola: niente moduli, niente centralino, niente numeretto. C’è una casella di posta e qualcuno che la legge.",
    rows: [
      { term: "E-mail", value: MAIL },
      { term: "Risposta", value: "di solito entro due giorni" },
      { term: "Dall’app", value: "menu, «Feedback», poi «Segnala un problema» o «Ho un’idea»" },
      { term: "Telefono", value: "non abbiamo un centralino. Se qualcuno chiama «da Kangur», non siamo noi. [[safety|Come riconoscerci (in inglese)]]" },
      { term: "Azienda", value: `${firmName}, NIP ${nip}, Poznań, Polonia` },
    ],
    shortcutsTitle: "Scorciatoie",
    shortcuts: [
      { title: "Premium", body: "Prezzo, disdetta e primo mese: [[pricing|prezzi (in inglese)]]." },
      { title: "Account", body: "Si elimina nell’app, senza scriverci: [[deleteAccount|eliminare l’account]]." },
      { title: "Come funziona", body: "Screenshot, reparti, inviti, niente campo: [[faq|domande e risposte (in inglese)]]." },
    ],
  },
  cs: {
    lines: ["Napiš nám.", "Odepíše člověk."],
    lead: "Kangura dělá jeden člověk, takže tu není formulář, infolinka ani pořadové číslo. Je tu schránka a někdo, kdo ji čte.",
    rows: [
      { term: "E-mail", value: MAIL },
      { term: "Odpověď", value: "obvykle do dvou dnů" },
      { term: "Z aplikace", value: "menu, „Zpětná vazba“ a tam „Nahlásit problém“ nebo „Mám nápad“" },
      { term: "Telefon", value: "infolinku nemáme. Když někdo volá „z Kangura“, nejsme to my. [[safety|Jak nás poznat (anglicky)]]" },
      { term: "Firma", value: `${firmName}, NIP ${nip}, Poznaň, Polsko` },
    ],
    shortcutsTitle: "Zkratky",
    shortcuts: [
      { title: "Premium", body: "Cena, zrušení a první měsíc: [[pricing|ceník (anglicky)]]." },
      { title: "Účet", body: "Smažeš ho v aplikaci, psát nám nemusíš: [[deleteAccount|smazání účtu]]." },
      { title: "Jak to funguje", body: "Screenshoty, uličky, pozvánky, bez signálu: [[faq|otázky a odpovědi (anglicky)]]." },
    ],
  },
  ru: {
    lines: ["Напишите.", "Ответит человек."],
    lead: "Kangur делает один человек, поэтому здесь нет формы, горячей линии и номерка в очереди. Есть почта и тот, кто её читает.",
    rows: [
      { term: "Почта", value: MAIL },
      { term: "Ответ", value: "обычно в течение двух дней" },
      { term: "Из приложения", value: "меню, «Обратная связь», а там «Сообщить о проблеме» или «У меня есть идея»" },
      { term: "Телефон", value: "горячей линии нет. Если звонят «из Kangur», это не мы. [[safety|Как нас узнать (на английском)]]" },
      { term: "Компания", value: `${firmName}, NIP ${nip}, Познань, Польша` },
    ],
    shortcutsTitle: "Возможно, ответ уже есть",
    shortcuts: [
      { title: "Premium", body: "Цена, отмена и первый месяц: [[pricing|цены (на английском)]]." },
      { title: "Аккаунт", body: "Удаляется в приложении, писать нам не нужно: [[deleteAccount|удаление аккаунта]]." },
      { title: "Как это работает", body: "Скриншоты, отделы, приглашения, нет связи: [[faq|вопросы и ответы (на английском)]]." },
    ],
  },
  uk: {
    lines: ["Напишіть.", "Відповість людина."],
    lead: "Kangur робить одна людина, тому тут немає форми, гарячої лінії чи номерка в черзі. Є пошта й той, хто її читає.",
    rows: [
      { term: "Пошта", value: MAIL },
      { term: "Відповідь", value: "зазвичай протягом двох днів" },
      { term: "Із застосунку", value: "меню, «Зворотний зв’язок», а там «Повідомити про проблему» або «Маю ідею»" },
      { term: "Телефон", value: "гарячої лінії немає. Якщо телефонують «з Kangur», це не ми. [[safety|Як нас упізнати (англійською)]]" },
      { term: "Компанія", value: `${firmName}, NIP ${nip}, Познань, Польща` },
    ],
    shortcutsTitle: "Можливо, відповідь уже є",
    shortcuts: [
      { title: "Premium", body: "Ціна, скасування й перший місяць: [[pricing|ціни (англійською)]]." },
      { title: "Обліковий запис", body: "Видаляється в застосунку, писати нам не треба: [[deleteAccount|видалення облікового запису]]." },
      { title: "Як це працює", body: "Скриншоти, відділи, запрошення, немає зв’язку: [[faq|питання й відповіді (англійською)]]." },
    ],
  },
  be: {
    lines: ["Напішыце.", "Адкажа чалавек."],
    lead: "Kangur робіць адзін чалавек, таму тут няма формы, гарачай лініі ці нумарка ў чарзе. Ёсць пошта і той, хто яе чытае.",
    rows: [
      { term: "Пошта", value: MAIL },
      { term: "Адказ", value: "звычайна на працягу двух дзён" },
      { term: "З праграмы", value: "меню, «Зваротная сувязь», а там «Паведаміць пра праблему» або «Маю ідэю»" },
      { term: "Тэлефон", value: "гарачай лініі няма. Калі тэлефануюць «з Kangur», гэта не мы. [[safety|Як нас пазнаць (па-англійску)]]" },
      { term: "Кампанія", value: `${firmName}, NIP ${nip}, Познань, Польшча` },
    ],
    shortcutsTitle: "Магчыма, адказ ужо ёсць",
    shortcuts: [
      { title: "Premium", body: "Цана, адмена і першы месяц: [[pricing|цэны (па-англійску)]]." },
      { title: "Уліковы запіс", body: "Выдаляецца ў праграме, пісаць нам не трэба: [[deleteAccount|выдаленне ўліковага запісу]]." },
      { title: "Як гэта працуе", body: "Скрыншоты, аддзелы, запрашэнні, няма сувязі: [[faq|пытанні і адказы (па-англійску)]]." },
    ],
  },
};

export function contactCopy(locale: AppLocale): ContactCopy {
  return typesetCopy(COPY[locale], locale);
}
