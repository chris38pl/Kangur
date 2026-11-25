import type { ReceiptLine } from "@/components/site/Receipt";
import type { Lines } from "@/lib/marketing/content/home-types";
import { typesetCopy } from "@/lib/marketing/typography";

export type PricingCopy = {
  crumb: string;
  eyebrow: string;
  lines: Lines;
  lead: readonly string[];
  receiptLabel: string;
  receipt: readonly ReceiptLine[];
  table: {
    title: string;
    intro: string;
    caption: string;
    head: readonly [string, string, string];
    rows: readonly (readonly [string, string, string])[];
    note: string;
  };
  uses: {
    title: string;
    intro: string;
    items: readonly { title: string; body: string }[];
    outro: string;
  };
  family: { title: string; body: readonly string[] };
  faqTitle: string;
  faq: readonly { q: string; a: string }[];
};

/** Prices and limits: marketing fact bank, checked against the code of 1.0.8. */
const COPY: Record<"pl" | "en", PricingCopy> = {
  pl: {
    crumb: "Cennik",
    eyebrow: "Kangur - cennik",
    lines: ["Ile kosztuje Kangur?", "Na start 0 zł."],
    lead: [
      "Listy, domownicy i tryb zakupów są darmowe, bez okresu próbnego. Premium kosztuje 9,99 zł miesięcznie za całą przestrzeń, czyli za wszystkich domowników. Nowi subskrybenci mają pierwszy miesiąc za darmo.",
      "Bez reklam w obu wersjach.",
    ],
    receiptLabel: "Cennik Kangura w formie paragonu",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "foot", text: "lista zakupów z AI" },
      { kind: "rule" },
      { kind: "item", text: "Wspólne listy", note: "ile chcesz", price: "0,00" },
      { kind: "item", text: "Domownicy", note: "ilu chcesz", price: "0,00" },
      { kind: "item", text: "Tryb zakupów", note: "alejka po alejce", price: "0,00" },
      { kind: "item", text: "10 użyć AI na start", note: "na całą przestrzeń", price: "0,00" },
      { kind: "item", text: "Reklamy", note: "nie prowadzimy", price: "-" },
      { kind: "total", text: "Za darmo", price: "0,00 zł" },
      { kind: "rule" },
      { kind: "item", text: "Premium, pierwszy miesiąc", note: "dla nowych", price: "0,00" },
      { kind: "item", text: "Premium, każdy kolejny", note: "za całą przestrzeń", price: "9,99" },
      { kind: "total", text: "Premium", price: "9,99 zł" },
      { kind: "rule" },
      { kind: "foot", text: "Paragon nie służy do zwrotu chipsów." },
    ],
    table: {
      title: "Co jest za darmo, a co w Premium",
      intro:
        "Różnice są dwie: ile pracuje AI i jak daleko sięga historia. Cała reszta działa tak samo.",
      caption: "Porównanie Kangura za darmo i w Premium",
      head: ["", "Za darmo", "Premium"],
      rows: [
        ["Listy i produkty", "bez limitu", "bez limitu"],
        ["Domownicy w przestrzeni", "bez limitu", "bez limitu"],
        ["Alejki, tryb zakupów, podsumowanie", "tak", "tak"],
        ["Użycia AI", "10 na przestrzeń, nie odnawiają się", "bez limitu"],
        ["Historia zakończonych list", "20 ostatnich", "200 ostatnich"],
        ["Lista z poprzednich zakupów", "tak, za 1 użycie AI", "tak, bez limitu"],
        ["Reklamy", "nie ma", "nie ma"],
        ["Cena", "0 zł", "9,99 zł miesięcznie, pierwszy miesiąc 0 zł"],
      ],
      note: "Cena dla Polski. Dokładną kwotę sklep pokazuje przed zakupem. Pierwszy darmowy miesiąc jest dla nowych subskrybentów. AI bez limitu oznacza zwykłe domowe używanie, zostaje tylko bezpiecznik na automaty: 10 użyć na minutę.",
    },
    uses: {
      title: "Co się liczy jako jedno użycie AI?",
      intro: "Jedna lista albo jedno dopisanie produktów przez AI, czy wyjdą 3 produkty, czy 30.",
      items: [
        { title: "Zrzut albo zdjęcie", body: "Jeden obrazek to jedno użycie, także z siedmioma wiadomościami." },
        { title: "Tekst", body: "Wklejony ze schowka, wpisany po przecinku albo podyktowany." },
        { title: "Z przepisu", body: "Do pięciu dań za jedno użycie." },
        { title: "Poprzednie listy", body: "Propozycja z pięciu ostatnich list." },
      ],
      outro:
        "Dodawanie ręczne nie kosztuje nic. Gdy AI nie odpowie albo zgłosi błąd, użycie wraca. Gdy się pomyli albo odrzucisz propozycję, nie wraca. Przy jednej liście ze zrzutu w tygodniu dziesięć użyć starcza na dziesięć tygodni.",
    },
    family: {
      title: "Jedna osoba płaci, korzystają wszyscy",
      body: [
        "Jedna subskrypcja wystarcza na całą przestrzeń, czyli na wspólne listy domu. W czteroosobowej rodzinie to około 2,50 zł na osobę miesięcznie.",
        "Kupić może właściciel przestrzeni, przez Google Play albo App Store. Kangur nie widzi numeru Twojej karty.",
      ],
    },
    faqTitle: "Pytania o pieniądze",
    faq: [
      {
        q: "Czy muszę podać kartę, żeby używać Kangura?",
        a: "Nie. O płatność pyta tylko Google Play albo App Store, i to dopiero wtedy, gdy wybierzesz Premium.",
      },
      {
        q: "Kiedy zapłacę pierwszy raz?",
        a: "Po darmowym miesiącu, jeśli wcześniej nie zrezygnujesz. Datę i kwotę sklep pokazuje przed potwierdzeniem.",
      },
      {
        q: "Jak zrezygnować z Premium?",
        a: "W ustawieniach subskrypcji w Google Play albo App Store, zależnie od tego, gdzie ją kupiono. Premium działa do końca opłaconego okresu.",
      },
      {
        q: "Co stanie się z listami po rezygnacji?",
        a: "Nic. Zostają, tylko w historii znów widać 20 ostatnich zakończonych.",
      },
      {
        q: "Czy usunięcie konta kończy subskrypcję?",
        a: "Nie. Subskrypcją zarządza sklep, więc najpierw anuluj ją w Google Play albo App Store, a potem usuń konto. [[deleteAccount|Jak usunąć konto]].",
      },
      {
        q: "Czy jest plan roczny albo rodzinny?",
        a: "Na razie jest tylko plan miesięczny. Osobnego planu rodzinnego nie trzeba, bo każdy Premium działa dla wszystkich osób w przestrzeni.",
      },
    ],
  },
  en: {
    crumb: "Pricing",
    eyebrow: "Kangur - pricing",
    lines: ["What does Kangur cost?", "Nothing to start."],
    lead: [
      "Lists, sharing and shopping mode are free, with no trial period. Premium is a monthly subscription for the whole space, so for everyone at home. The app shows the price in your currency, and in Poland it is 9.99 PLN.",
      "No ads in either version.",
    ],
    receiptLabel: "Kangur prices as a receipt",
    receipt: [
      { kind: "head", text: "Kangur" },
      { kind: "foot", text: "grocery list with AI" },
      { kind: "rule" },
      { kind: "item", text: "Shared lists", note: "as many as you like", price: "0.00" },
      { kind: "item", text: "People at home", note: "as many as you like", price: "0.00" },
      { kind: "item", text: "Shopping mode", note: "aisle by aisle", price: "0.00" },
      { kind: "item", text: "10 AI uses to start", note: "for the whole space", price: "0.00" },
      { kind: "item", text: "Ads", note: "we don’t carry those", price: "-" },
      { kind: "total", text: "Free", price: "0.00" },
      { kind: "rule" },
      { kind: "item", text: "Premium, monthly", note: "for the whole space", price: "in the app" },
      { kind: "rule" },
      { kind: "foot", text: "This receipt cannot be used to return chips." },
    ],
    table: {
      title: "What is free and what comes with Premium",
      intro: "There are two differences: how much AI you get and how far back your history goes. Everything else is the same.",
      caption: "Kangur free compared with Premium",
      head: ["", "Free", "Premium"],
      rows: [
        ["Lists and items", "unlimited", "unlimited"],
        ["People in a space", "unlimited", "unlimited"],
        ["Aisles, shopping mode, summary", "yes", "yes"],
        ["AI uses", "10 per space, they do not renew", "unlimited"],
        ["History of finished lists", "last 20", "last 200"],
        ["List from previous shopping", "yes, for 1 AI use", "yes, unlimited"],
        ["Ads", "none", "none"],
        ["Price", "0", "shown in the app, 9.99 PLN a month in Poland"],
      ],
      note: "The first month is free for new subscribers where the store offers it. Unlimited AI means ordinary home use. Only a fuse against bots stays: 10 uses a minute.",
    },
    uses: {
      title: "What counts as one AI use?",
      intro: "One list, or one batch of items added by AI, whether it comes out as 3 items or 30.",
      items: [
        { title: "Screenshot or photo", body: "One image is one use, even with seven messages in it." },
        { title: "Text", body: "Pasted from the clipboard, typed with commas or dictated." },
        { title: "From a recipe", body: "Up to five dishes in one use." },
        { title: "Previous lists", body: "A suggestion from your last five lists." },
      ],
      outro: "Adding by hand costs nothing. If AI does not answer or reports an error, you get the use back. If it gets something wrong or you discard the suggestion, you do not. At one screenshot a week, ten uses last ten weeks.",
    },
    family: {
      title: "One person pays, everyone uses it",
      body: [
        "One Premium subscription covers one space, the shared lists of a home, and everyone in it.",
        "The owner of the space buys it through Google Play or the App Store. Kangur never sees your card number.",
      ],
    },
    faqTitle: "Questions about money",
    faq: [
      { q: "Do I need a card to use Kangur?", a: "No. Only Google Play or the App Store asks for payment, and only once you choose Premium." },
      { q: "When do I pay for the first time?", a: "After the free month where it is offered, unless you cancel before it ends. The store shows the date and the amount before you confirm." },
      { q: "How do I cancel Premium?", a: "In the subscription settings of Google Play or the App Store, wherever you bought it. Premium works until the end of the paid period." },
      { q: "What happens to my lists when I cancel?", a: "Nothing. They stay, and the history shows the last 20 finished ones again." },
      { q: "Does deleting my account end the subscription?", a: "No. The store manages subscriptions, so cancel it in Google Play or the App Store first and then delete the account. [[deleteAccount|How to delete your account]]." },
      { q: "Is there a yearly or family plan?", a: "For now there is only a monthly plan. A family plan is not needed: Premium already covers everyone in the space." },
    ],
  },
};

export const PRICING = { pl: typesetCopy(COPY.pl), en: COPY.en };
