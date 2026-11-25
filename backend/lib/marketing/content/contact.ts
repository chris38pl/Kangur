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
const { firmName, nip, regon, addressPl, addressEn } = LEGAL_ENTITY;

const COPY: Record<AppLocale, ContactCopy> = {
  pl: {
    lines: ["Napisz.", "Odpisze człowiek."],
    lead: "Kangura robi jedna osoba, więc nie ma tu formularza, infolinii ani numerka w kolejce. Jest skrzynka i ktoś, kto ją czyta.",
    rows: [
      { term: "E-mail", value: MAIL },
      { term: "Odpowiedź", value: "zwykle w ciągu 24-48 godzin" },
      { term: "Z aplikacji", value: "menu, „Opinia”, a tam „Zgłoś problem” albo „Mam pomysł”" },
      { term: "Telefon", value: "nie mamy. Jeśli ktoś dzwoni „z Kangura”, to nie my. [[safety|Jak nas rozpoznać]]" },
      { term: "Firma", value: `${firmName}, NIP ${nip}, REGON ${regon}, ${addressPl}` },
    ],
    shortcutsTitle: "Może wystarczy skrót",
    shortcuts: [
      { title: "Premium", body: "Cena, rezygnacja i pierwszy miesiąc: [[pricing|cennik]]." },
      { title: "Konto", body: "Usuniesz je w aplikacji, bez pisania do nas: [[deleteAccount|usunięcie konta]]." },
      { title: "Jak to działa", body: "Zrzuty, alejki, zaproszenia, brak zasięgu: [[faq|pytania i odpowiedzi]]." },
    ],
  },
  en: {
    lines: ["Write to us.", "A person writes back."],
    lead: "Kangur is made by one person, so there is no form, no hotline and no ticket number. There is a mailbox and somebody who reads it.",
    rows: [
      { term: "Email", value: MAIL },
      { term: "Reply", value: "usually within 24-48 hours" },
      { term: "From the app", value: "menu, “Feedback”, then “Report a problem” or “I have an idea”" },
      { term: "Phone", value: "we do not have one. If somebody calls “from Kangur”, it is not us. [[safety|How to recognise us]]" },
      { term: "Company", value: `${firmName}, VAT PL${nip}, ${addressEn}` },
    ],
    shortcutsTitle: "Maybe a shortcut is enough",
    shortcuts: [
      { title: "Premium", body: "Price, cancelling and the first month: [[pricing|pricing]]." },
      { title: "Account", body: "You can delete it in the app, without writing to us: [[deleteAccount|deleting your account]]." },
      { title: "How it works", body: "Screenshots, aisles, invitations, no signal: [[faq|questions and answers]]." },
    ],
  },
  de: {
    lines: ["Schreib uns.", "Ein Mensch antwortet."],
    lead: "Kangur macht eine einzige Person. Es gibt also kein Formular, keine Hotline und keine Wartenummer, sondern ein Postfach und jemanden, der es liest.",
    rows: [
      { term: "E-Mail", value: MAIL },
      { term: "Antwort", value: "meist innerhalb von 24-48 Stunden" },
      { term: "In der App", value: "Menü, „Feedback“, dann „Problem melden“ oder „Ich habe eine Idee“" },
      { term: "Telefon", value: "haben wir nicht. Ruft jemand „von Kangur“ an, sind das nicht wir. [[safety|So erkennst du uns]]" },
      { term: "Firma", value: `${firmName}, USt-IdNr. PL${nip}, ul. Sielawy 23e/19, 61-619 Poznań, Polen` },
    ],
    shortcutsTitle: "Vielleicht reicht eine Abkürzung",
    shortcuts: [
      { title: "Premium", body: "Preis, Kündigung und der erste Monat: [[pricing|Preise]]." },
      { title: "Konto", body: "Du löschst es in der App, ohne uns zu schreiben: [[deleteAccount|Konto löschen]]." },
      { title: "So funktioniert’s", body: "Screenshots, Gänge, Einladungen, kein Empfang: [[faq|Fragen und Antworten]]." },
    ],
  },
  fr: {
    lines: ["Écrivez-nous.", "Quelqu’un vous répond."],
    lead: "Kangur est fait par une seule personne : pas de formulaire, pas de standard, pas de ticket d’attente. Juste une boîte mail et quelqu’un qui la lit.",
    rows: [
      { term: "E-mail", value: MAIL },
      { term: "Réponse", value: "en général sous 24 à 48 heures" },
      { term: "Dans l’appli", value: "menu, « Commentaires », puis « Signaler un problème » ou « J’ai une idée »" },
      { term: "Téléphone", value: "nous n’en avons pas. Si quelqu’un appelle « de la part de Kangur », ce n’est pas nous. [[safety|Comment nous reconnaître]]" },
      { term: "Entreprise", value: `${firmName}, TVA PL${nip}, ul. Sielawy 23e/19, 61-619 Poznań, Pologne` },
    ],
    shortcutsTitle: "Un raccourci suffit peut-être",
    shortcuts: [
      { title: "Premium", body: "Prix, résiliation et premier mois : [[pricing|tarifs]]." },
      { title: "Compte", body: "Il se supprime dans l’appli, sans nous écrire : [[deleteAccount|supprimer le compte]]." },
      { title: "Comment ça marche", body: "Captures, rayons, invitations, pas de réseau : [[faq|questions et réponses]]." },
    ],
  },
  es: {
    lines: ["Escríbenos.", "Responde una persona."],
    lead: "Kangur lo hace una sola persona, así que aquí no hay formulario, ni centralita, ni número de turno. Hay un buzón y alguien que lo lee.",
    rows: [
      { term: "Correo", value: MAIL },
      { term: "Respuesta", value: "normalmente en 24-48 horas" },
      { term: "Desde la app", value: "menú, «Comentarios», y allí «Informar de un problema» o «Tengo una idea»" },
      { term: "Teléfono", value: "no tenemos. Si alguien llama «de parte de Kangur», no somos nosotros. [[safety|Cómo reconocernos]]" },
      { term: "Empresa", value: `${firmName}, NIF-IVA PL${nip}, ul. Sielawy 23e/19, 61-619 Poznań, Polonia` },
    ],
    shortcutsTitle: "Quizá baste un atajo",
    shortcuts: [
      { title: "Premium", body: "Precio, cancelación y primer mes: [[pricing|precios]]." },
      { title: "Cuenta", body: "Se elimina en la app, sin escribirnos: [[deleteAccount|eliminar la cuenta]]." },
      { title: "Cómo funciona", body: "Capturas, pasillos, invitaciones, sin cobertura: [[faq|preguntas y respuestas]]." },
    ],
  },
  it: {
    lines: ["Scrivici.", "Risponde una persona."],
    lead: "Kangur lo fa una persona sola: niente moduli, niente centralino, niente numeretto. C’è una casella di posta e qualcuno che la legge.",
    rows: [
      { term: "E-mail", value: MAIL },
      { term: "Risposta", value: "di solito entro 24-48 ore" },
      { term: "Dall’app", value: "menu, «Feedback», poi «Segnala un problema» o «Ho un’idea»" },
      { term: "Telefono", value: "non ce l’abbiamo. Se qualcuno chiama «da Kangur», non siamo noi. [[safety|Come riconoscerci]]" },
      { term: "Azienda", value: `${firmName}, partita IVA PL${nip}, ul. Sielawy 23e/19, 61-619 Poznań, Polonia` },
    ],
    shortcutsTitle: "Forse basta una scorciatoia",
    shortcuts: [
      { title: "Premium", body: "Prezzo, disdetta e primo mese: [[pricing|prezzi]]." },
      { title: "Account", body: "Si elimina nell’app, senza scriverci: [[deleteAccount|eliminare l’account]]." },
      { title: "Come funziona", body: "Screenshot, corsie, inviti, niente campo: [[faq|domande e risposte]]." },
    ],
  },
  cs: {
    lines: ["Napiš nám.", "Odepíše člověk."],
    lead: "Kangur dělá jeden člověk, takže tu není formulář, infolinka ani pořadové číslo. Je tu schránka a někdo, kdo ji čte.",
    rows: [
      { term: "E-mail", value: MAIL },
      { term: "Odpověď", value: "obvykle do 24-48 hodin" },
      { term: "Z aplikace", value: "menu, „Zpětná vazba“ a tam „Nahlásit problém“ nebo „Mám nápad“" },
      { term: "Telefon", value: "nemáme. Když někdo volá „z Kanguru“, nejsme to my. [[safety|Jak nás poznat]]" },
      { term: "Firma", value: `${firmName}, DIČ PL${nip}, ul. Sielawy 23e/19, 61-619 Poznaň, Polsko` },
    ],
    shortcutsTitle: "Možná stačí zkratka",
    shortcuts: [
      { title: "Premium", body: "Cena, zrušení a první měsíc: [[pricing|ceník]]." },
      { title: "Účet", body: "Smažeš ho v aplikaci, psát nám nemusíš: [[deleteAccount|smazání účtu]]." },
      { title: "Jak to funguje", body: "Snímky, uličky, pozvánky, bez signálu: [[faq|otázky a odpovědi]]." },
    ],
  },
  ru: {
    lines: ["Напишите.", "Ответит человек."],
    lead: "Kangur делает один человек, поэтому здесь нет формы, горячей линии и номерка в очереди. Есть почта и тот, кто её читает.",
    rows: [
      { term: "Почта", value: MAIL },
      { term: "Ответ", value: "обычно в течение 24-48 часов" },
      { term: "Из приложения", value: "меню, «Обратная связь», а там «Сообщить о проблеме» или «У меня есть идея»" },
      { term: "Телефон", value: "его нет. Если звонят «из Kangur», это не мы. [[safety|Как нас узнать]]" },
      { term: "Компания", value: `${firmName}, NIP ${nip}, ul. Sielawy 23e/19, 61-619 Познань, Польша` },
    ],
    shortcutsTitle: "Может, хватит короткого пути",
    shortcuts: [
      { title: "Premium", body: "Цена, отмена и первый месяц: [[pricing|цены]]." },
      { title: "Аккаунт", body: "Удаляется в приложении, писать нам не нужно: [[deleteAccount|удаление аккаунта]]." },
      { title: "Как это работает", body: "Скриншоты, отделы, приглашения, нет связи: [[faq|вопросы и ответы]]." },
    ],
  },
  uk: {
    lines: ["Напишіть.", "Відповість людина."],
    lead: "Kangur робить одна людина, тому тут немає форми, гарячої лінії чи номерка в черзі. Є пошта й той, хто її читає.",
    rows: [
      { term: "Пошта", value: MAIL },
      { term: "Відповідь", value: "зазвичай протягом 24-48 годин" },
      { term: "Із застосунку", value: "меню, «Зворотний зв’язок», а там «Повідомити про проблему» або «Маю ідею»" },
      { term: "Телефон", value: "його немає. Якщо телефонують «з Kangur», це не ми. [[safety|Як нас упізнати]]" },
      { term: "Компанія", value: `${firmName}, NIP ${nip}, ul. Sielawy 23e/19, 61-619 Познань, Польща` },
    ],
    shortcutsTitle: "Може, вистачить короткого шляху",
    shortcuts: [
      { title: "Premium", body: "Ціна, скасування й перший місяць: [[pricing|ціни]]." },
      { title: "Обліковий запис", body: "Видаляється в застосунку, писати нам не треба: [[deleteAccount|видалення облікового запису]]." },
      { title: "Як це працює", body: "Скриншоти, відділи, запрошення, немає зв’язку: [[faq|питання й відповіді]]." },
    ],
  },
  be: {
    lines: ["Напішыце.", "Адкажа чалавек."],
    lead: "Kangur робіць адзін чалавек, таму тут няма формы, гарачай лініі ці нумарка ў чарзе. Ёсць пошта і той, хто яе чытае.",
    rows: [
      { term: "Пошта", value: MAIL },
      { term: "Адказ", value: "звычайна на працягу 24-48 гадзін" },
      { term: "З праграмы", value: "меню, «Зваротная сувязь», а там «Паведаміць пра праблему» або «Маю ідэю»" },
      { term: "Тэлефон", value: "яго няма. Калі тэлефануюць «з Kangur», гэта не мы. [[safety|Як нас пазнаць]]" },
      { term: "Кампанія", value: `${firmName}, NIP ${nip}, ul. Sielawy 23e/19, 61-619 Познань, Польшча` },
    ],
    shortcutsTitle: "Можа, хопіць кароткага шляху",
    shortcuts: [
      { title: "Premium", body: "Цана, адмена і першы месяц: [[pricing|цэны]]." },
      { title: "Акаўнт", body: "Выдаляецца ў праграме, пісаць нам не трэба: [[deleteAccount|выдаленне акаўнта]]." },
      { title: "Як гэта працуе", body: "Скрыншоты, аддзелы, запрашэнні, няма сувязі: [[faq|пытанні і адказы]]." },
    ],
  },
};

export function contactCopy(locale: AppLocale): ContactCopy {
  return locale === "pl" ? typesetCopy(COPY.pl) : COPY[locale];
}
