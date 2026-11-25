import type { Lines } from "@/lib/marketing/content/home-types";
import { typesetCopy } from "@/lib/marketing/typography";

type Card = { title: string; body: string };

export type SafetyCopy = {
  crumb: string;
  eyebrow: string;
  lines: Lines;
  lead: readonly string[];
  label: {
    title: string;
    subtitle: string;
    rows: readonly { term: string; value: string }[];
    footer: string;
  };
  permissions: { title: string; intro: string; items: readonly Card[]; outro: string };
  screenshot: { title: string; intro: string; steps: readonly Card[]; outro: readonly string[] };
  check: { title: string; intro: string; rows: readonly { term: string; value: string }[] };
  never: { title: string; intro: string; items: readonly string[]; outro: string };
  other: { title: string; body: readonly string[] };
  help: { title: string; intro: string; steps: readonly string[] };
  faqTitle: string;
  faq: readonly { q: string; a: string }[];
  closing: { lines: Lines; body: string };
};

const STORES = {
  play: "https://play.google.com/store/apps/details?id=app.kangur",
  apple: "https://apps.apple.com/pl/app/kangur/id6832296080",
};

/**
 * Order matters here: first what is true, then one calm paragraph about the other program,
 * then what is true again and what to do. Repeating a rumour is what makes it stick.
 * Facts from the code of 1.0.8 (permissions, what goes to AI, what is stored).
 */
const COPY: Record<"pl" | "en", SafetyCopy> = {
  pl: {
    crumb: "Bezpieczeństwo",
    eyebrow: "Kangur - lista zakupów z AI",
    lines: ["Czy aplikacja Kangur", "jest bezpieczna?"],
    lead: [
      "Kangur to lista zakupów na telefon. Nie steruje telefonem ani komputerem, nie widzi ekranu i nie ma dostępu do banku, SMS-ów, kontaktów ani GPS-u.",
      "Pobierzesz go tylko z Google Play i App Store. Robi go Krzysztof Krawiec Software z Poznania.",
    ],
    label: {
      title: "Kangur",
      subtitle: "lista zakupów z AI, 1 sztuka na telefon",
      rows: [
        { term: "Skład", value: "listy zakupów, alejki, domownicy, historia, powiadomienia o zakupach" },
        { term: "Nie zawiera", value: "zdalnego pulpitu, nagrywania ekranu, dostępu do SMS-ów, kontaktów i GPS-u, reklam" },
        { term: "Pyta o", value: "aparat i zdjęcia, mikrofon i rozpoznawanie mowy, powiadomienia. Każdej zgody możesz odmówić" },
        { term: "Producent", value: "Krzysztof Krawiec Software, ul. Sielawy 23e/19, 61-619 Poznań, NIP 9721382309" },
        { term: "Dostępny w", value: "Google Play i App Store, nigdzie indziej" },
        { term: "Uwaga", value: "nie robić zakupów na głodno" },
      ],
      footer: "Identyfikatory w sklepach: app.kangur i 6832296080",
    },
    permissions: {
      title: "O jakie zgody prosi Kangur i po co",
      intro: "O aparat, zdjęcia i mikrofon pyta dopiero wtedy, gdy ich potrzebujesz. O powiadomienia pyta po zalogowaniu.",
      items: [
        { title: "Aparat i zdjęcia", body: "Gdy robisz listę ze zdjęcia albo zrzutu, zmieniasz zdjęcie w profilu albo dołączasz je do zgłoszenia. Kangur wysyła tylko obrazek, który wybierzesz." },
        { title: "Mikrofon", body: "Gdy stukniesz mikrofon przy wpisywaniu listy. Mowę na tekst zamienia usługa Twojego telefonu, zwykle Apple albo Google, a Kangur dostaje gotowy tekst." },
        { title: "Powiadomienia", body: "Żeby dać znać o zaproszeniu i o tym, że ktoś zaczął albo skończył zakupy. Każdy rodzaj wyłączysz w ustawieniach." },
        { title: "Internet", body: "Żeby lista była ta sama u wszystkich domowników." },
      ],
      outro: "Odmowa wyłącza tylko tę jedną rzecz. Listę zawsze możesz napisać ręcznie.",
    },
    screenshot: {
      title: "Co się dzieje ze zrzutem rozmowy",
      intro: "Kangur nie ma dostępu do żadnego komunikatora. Dostaje tylko obrazek, który mu podasz.",
      steps: [
        { title: "Wybierasz obrazek", body: "Jeden, z galerii albo prosto z aparatu. Imię rozmówcy możesz wcześniej wyciąć z kadru." },
        { title: "AI czyta produkty", body: "Obrazek, jego nazwa i to, co już jest na tej liście (produkty, ilości, notatki), trafiają do dostawcy AI (OpenAI), który przechowuje je według swoich zasad. Kangur nie dołącza Twojego imienia ani e-maila." },
        { title: "Zostaje lista", body: "Kangur zapisuje to, co AI odczytało. Samego obrazka nie zapisuje." },
      ],
      outro: [
        "Listy widzą osoby z Twojej przestrzeni. Techniczny dostęp ma też twórca aplikacji, żeby móc pomóc, gdy coś się zepsuje. Danych nie sprzedajemy. Statystyki użycia są przypisane do numeru konta, ale bez nazw produktów i bez nagrywania ekranu.",
        "Konto usuniesz w aplikacji, bez pisania do nas. Szczegóły: [[privacy|polityka prywatności]] i [[deleteAccount|usuwanie konta]].",
      ],
    },
    check: {
      title: "Jak sprawdzić, że to na pewno my",
      intro: "Kangurów w sieci jest dużo. Nasz ma te znaki szczególne:",
      rows: [
        { term: "Ikona", value: "pomarańczowy kangur w turkusowej bluzie" },
        { term: "Google Play", value: `[[${STORES.play}|app.kangur]], deweloper Krzysztof Krawiec Labs` },
        { term: "App Store", value: `[[${STORES.apple}|id 6832296080]], sprzedawca Krzysztof Krawiec` },
        { term: "Strona", value: "getkangur.com, innych nie mamy" },
        { term: "TikTok", value: "[[https://www.tiktok.com/@getkangur|@getkangur]]" },
        { term: "Kontakt", value: "contact@getkangur.com i support@getkangur.com" },
      ],
    },
    never: {
      title: "Czego Kangur nigdy nie zrobi",
      intro: "Nie mamy infolinii, doradców ani konsultantów. Dlatego:",
      items: [
        "nie zadzwonimy do Ciebie",
        "nie poprosimy o hasło do banku, kod BLIK ani kod z SMS-a",
        "nie każemy instalować żadnego innego programu",
        "nie każemy instalować niczego na komputerze",
        "nie zaproponujemy inwestycji ani przelewu, a za Premium płacisz tylko w sklepie z aplikacjami",
      ],
      outro: "Jeśli ktoś dzwoni „z Kangura”, to nie my. Rozłącz się.",
    },
    other: {
      title: "Inny program o tej samej nazwie",
      body: [
        "W czerwcu 2025 [[https://ilawa.policja.gov.pl/o08/aktualnosci/138166,Myslal-ze-odzyska-zainwestowane-pieniadze.html|policja w Iławie]] opisała sprawę mężczyzny, którego rozmówca namówił na zainstalowanie na komputerze programu „Kangur”.",
        "To inny program. Nasz Kangur to aplikacja na telefon, robi tylko listy zakupów, a jego pierwsza wersja powstała w lipcu 2026, ponad rok później. Łączy je tylko zwierzę w nazwie.",
      ],
    },
    help: {
      title: "Ktoś namówił Cię na zdalny dostęp? Co zrobić teraz",
      intro: "Nieważne, jak nazywał się program. Liczy się kolejność:",
      steps: [
        "Odłącz komputer albo telefon od internetu.",
        "Zadzwoń do banku pod numer z karty i poproś o zablokowanie dostępu do konta.",
        "Z innego urządzenia zmień hasła do banku i poczty.",
        "Zgłoś sprawę na policji i w CERT Polska: [[https://incydent.cert.pl|incydent.cert.pl]]. Podejrzanego SMS-a przekaż na numer 8080.",
        "Zanim znów użyjesz tego urządzenia, daj je do sprawdzenia.",
      ],
    },
    faqTitle: "Krótkie odpowiedzi",
    faq: [
      {
        q: "Czy Kangur może wejść na moje konto w banku?",
        a: "Nie. Nie widzi ekranu, nie czyta SMS-ów i nie steruje innymi aplikacjami. Za Premium płacisz w Google Play albo App Store, a numeru karty Kangur nie zna.",
      },
      {
        q: "Czy Kangur czyta moje rozmowy?",
        a: "Nie. Dostaje tylko ten jeden zrzut, który wybierzesz, i nie ma połączenia z żadnym komunikatorem.",
      },
      {
        q: "Czy da się używać Kangura bez dawania zgód?",
        a: "Tak. Bez aparatu, mikrofonu i powiadomień działa pisanie listy, alejki, tryb zakupów i wspólne listy.",
      },
      {
        q: "Dla kogo jest Kangur?",
        a: "Dla osób od 16 lat. Nie jest skierowany do dzieci.",
      },
      {
        q: "Gdzie zgłosić problem z bezpieczeństwem?",
        a: "Napisz na [[mailto:support@getkangur.com|support@getkangur.com]]. Odpowiada twórca aplikacji.",
      },
    ],
    closing: {
      lines: ["Tylko lista.", "Aż lista."],
      body: "Kangur z Google Play i App Store. Gdzie indziej go nie ma.",
    },
  },
  en: {
    crumb: "Safety",
    eyebrow: "Kangur - grocery list with AI",
    lines: ["Is the Kangur app", "safe?"],
    lead: [
      "Kangur is a grocery list for your phone. It does not control your phone or computer, cannot see your screen and has no access to your bank, texts, contacts or GPS.",
      "It is available only on Google Play and the App Store. It is made by Krzysztof Krawiec Software in Poznań, Poland.",
    ],
    label: {
      title: "Kangur",
      subtitle: "grocery list with AI, 1 per phone",
      rows: [
        { term: "Ingredients", value: "grocery lists, aisles, your household, history, notifications about shopping" },
        { term: "Free from", value: "remote desktop, screen recording, access to texts, contacts and GPS, ads" },
        { term: "Asks for", value: "camera and photos, microphone and speech recognition, notifications. You can refuse each of them" },
        { term: "Made by", value: "Krzysztof Krawiec Software, ul. Sielawy 23e/19, 61-619 Poznań, Poland, NIP 9721382309" },
        { term: "Available on", value: "Google Play and the App Store, nowhere else" },
        { term: "Caution", value: "do not shop hungry" },
      ],
      footer: "Store IDs: app.kangur and 6832296080",
    },
    permissions: {
      title: "Which permissions Kangur asks for, and why",
      intro: "It asks for the camera, photos and microphone only when you need them. It asks about notifications after you sign in.",
      items: [
        { title: "Camera and photos", body: "When you make a list from a photo or a screenshot, change your profile picture or attach one to a report. Kangur sends only the image you pick." },
        { title: "Microphone", body: "When you tap the microphone while typing a list. A service of your phone, usually Apple’s or Google’s, turns speech into text, and Kangur gets the text." },
        { title: "Notifications", body: "To tell you about an invitation and about someone starting or finishing shopping. Each kind can be switched off." },
        { title: "Internet", body: "So the list is the same for everyone at home." },
      ],
      outro: "Refusing switches off that one thing. You can always type a list by hand.",
    },
    screenshot: {
      title: "What happens to a chat screenshot",
      intro: "Kangur has no access to any messaging app. It gets only the image you hand it.",
      steps: [
        { title: "You pick an image", body: "One, from the gallery or straight from the camera. You can crop out the other person’s name first." },
        { title: "AI reads the items", body: "The image, its name and what is already on that list (items, amounts, notes) go to the AI provider (OpenAI), which keeps them under its own rules. Kangur does not attach your name or email." },
        { title: "The list stays", body: "Kangur keeps what AI has read. It does not keep the image." },
      ],
      outro: [
        "Lists are seen by the people in your space. The maker of the app has technical access too, to help when something breaks. We do not sell data. Usage statistics are tied to an account number, but carry no product names and no screen recordings.",
        "You can delete your account in the app without writing to us. Details: [[privacy|privacy policy]] and [[deleteAccount|deleting your account]].",
      ],
    },
    check: {
      title: "How to check it is really us",
      intro: "There are many kangaroos out there. Ours looks like this:",
      rows: [
        { term: "Icon", value: "an orange kangaroo in a teal hoodie" },
        { term: "Google Play", value: `[[${STORES.play}|app.kangur]], developer Krzysztof Krawiec Labs` },
        { term: "App Store", value: `[[${STORES.apple}|id 6832296080]], seller Krzysztof Krawiec` },
        { term: "Website", value: "getkangur.com, we have no other" },
        { term: "TikTok", value: "[[https://www.tiktok.com/@getkangur|@getkangur]]" },
        { term: "Contact", value: "contact@getkangur.com and support@getkangur.com" },
      ],
    },
    never: {
      title: "What Kangur will never do",
      intro: "We have no call center, no advisers and no consultants. So we:",
      items: [
        "will not call you",
        "will not ask for a bank password, a payment code or a code from a text message",
        "will not tell you to install any other program",
        "will not tell you to install anything on a computer",
        "will not offer you investments or ask for a transfer: you pay for Premium only in the app store",
      ],
      outro: "If somebody calls “from Kangur”, it is not us. Hang up.",
    },
    other: {
      title: "Another program with the same name",
      body: [
        "In June 2025 the [[https://ilawa.policja.gov.pl/o08/aktualnosci/138166,Myslal-ze-odzyska-zainwestowane-pieniadze.html|police in Iława, Poland]] described the case of a man who was talked into installing a program called “Kangur” on his computer.",
        "That is a different program. Our Kangur is a phone app, makes only grocery lists, and its first version was written in July 2026, more than a year later. All they share is the animal in the name.",
      ],
    },
    help: {
      title: "Somebody talked you into remote access? What to do now",
      intro: "Whatever the program was called, the order is what counts:",
      steps: [
        "Disconnect the computer or phone from the internet.",
        "Call your bank on the number on your card and ask to block access to your account.",
        "From another device, change the passwords to your bank and email.",
        "Report it to the police. In Poland also to CERT Polska: [[https://incydent.cert.pl|incydent.cert.pl]].",
        "Have the device checked before you use it again.",
      ],
    },
    faqTitle: "Short answers",
    faq: [
      { q: "Can Kangur get into my bank account?", a: "No. It cannot see the screen, does not read texts and does not control other apps. You pay for Premium in Google Play or the App Store, and Kangur never learns your card number." },
      { q: "Does Kangur read my conversations?", a: "No. It gets only the one screenshot you pick and has no connection to any messaging app." },
      { q: "Can I use Kangur without giving permissions?", a: "Yes. Without camera, microphone and notifications you can still type lists, use aisles, shopping mode and shared lists." },
      { q: "Who is Kangur for?", a: "For people aged 16 and over. It is not aimed at children." },
      { q: "Where do I report a security problem?", a: "Write to [[mailto:support@getkangur.com|support@getkangur.com]]. The maker of the app answers." },
    ],
    closing: {
      lines: ["Just a list.", "A proper one."],
      body: "Kangur on Google Play and the App Store. Nowhere else.",
    },
  },
};

export const SAFETY = { pl: typesetCopy(COPY.pl), en: COPY.en };
