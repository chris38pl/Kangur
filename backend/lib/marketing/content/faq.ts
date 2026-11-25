import { typesetCopy } from "@/lib/marketing/typography";

export type FaqGroup = {
  title: string;
  items: readonly { q: string; a: string }[];
};

export type FaqPageCopy = {
  lines: readonly [string, string];
  lead: string;
  groups: readonly FaqGroup[];
};

/** Every answer was checked against the code of 1.0.8. No promises the app does not keep. */
const COPY: Record<"pl" | "en", FaqPageCopy> = {
  pl: {
    lines: ["Pytania i odpowiedzi", "o Kangurze."],
    lead: "Krótko i bez marketingu. Nie ma tu Twojego pytania? [[contact|Napisz]], odpowiadamy zwykle w ciągu 24-48 godzin.",
    groups: [
      {
        title: "Robienie listy",
        items: [
          {
            q: "Jak zrobić listę zakupów ze zrzutu ekranu czatu?",
            a: "Zrób zrzut rozmowy, w Kangurze wybierz „Obraz” albo „Zrzut ekranu” i wskaż ten obrazek. Kangur założy listę, wypisze produkty z ilościami i przydzieli je do alejek. Jeden obrazek na raz, może być na nim kilka wiadomości.",
          },
          {
            q: "Czy muszę zatwierdzać to, co odczytało AI?",
            a: "Nie. Produkty ze zdjęcia, zrzutu i tekstu trafiają od razu na listę, a Ty możesz każdy zmienić, przenieść albo usunąć. Przy przepisach i poprzednich listach najpierw odznaczasz to, czego nie potrzebujesz.",
          },
          {
            q: "Czy Kangur odczyta odręczną kartkę?",
            a: "Zwykłe pismo tak. Przy bardzo niewyraźnym może coś pominąć albo pomylić, dlatego po zdjęciu kartki warto rzucić okiem na listę.",
          },
          {
            q: "Czy mogę dyktować?",
            a: "Tak, w polu „Opisz listę” jest „Dyktuj mikrofonem”. Mowę na tekst zamienia telefon, a Kangur robi z niego listę.",
          },
          {
            q: "Jak działa lista z przepisu?",
            a: "Wpisujesz nazwy dań, do pięciu naraz. Kangur podaje składniki każdego dania, łączy te, które się powtarzają, a Ty odznaczasz to, co masz w domu. Linku do przepisu nie trzeba.",
          },
          {
            q: "Skąd Kangur wie, co kupuję zawsze?",
            a: "Z Twoich list. Zbiera produkty z pięciu ostatnich i pokazuje, które powtarzają się najczęściej. Listy, które mają mieć pierwszeństwo, oznaczysz gwiazdką.",
          },
        ],
      },
      {
        title: "W sklepie",
        items: [
          {
            q: "Czym jest tryb zakupów?",
            a: "To widok listy na czas zakupów. Idziesz alejka po alejce i przesuwasz produkty: w prawo kupione, w lewo nie było. Ekran nie gaśnie. Na koniec dostajesz podsumowanie: co kupione, czego nie było i ile to trwało.",
          },
          {
            q: "Czy mogę ustawić kolejność alejek jak w moim sklepie?",
            a: "Tak. Są 24 alejki, a ich kolejność ustawisz palcem i zapiszesz razem z listą.",
          },
          {
            q: "Co działa bez zasięgu?",
            a: "Odhaczanie produktów na otwartej liście. Zmiany czekają w telefonie i wysyłają się, gdy wrócisz do aplikacji z internetem. Tworzenie list, edycja i AI potrzebują internetu.",
          },
        ],
      },
      {
        title: "Wspólne listy",
        items: [
          {
            q: "Jak dodać drugą osobę do listy?",
            a: "Zapraszasz ją e-mailem do swojej przestrzeni. Zaproszenie jest ważne 7 dni i działa dla adresu, na który zostało wysłane. Najlepiej, żeby druga osoba najpierw zainstalowała Kangura i założyła konto na ten sam adres.",
          },
          {
            q: "Ile osób może korzystać z jednej listy?",
            a: "Ile chcesz. Nie ma limitu osób ani przestrzeni, także bez Premium.",
          },
          {
            q: "Jak szybko druga osoba zobaczy zmianę?",
            a: "Na otwartej liście po kilku sekundach, w trybie zakupów po kilkunastu. Jeśli aplikacja jest zamknięta, zmiana pokaże się po otwarciu.",
          },
          {
            q: "O czym powiadamia Kangur?",
            a: "O zaproszeniach oraz o tym, że ktoś zaczął albo skończył zakupy. Możesz też włączyć powiadomienia o nowych i usuniętych listach, a każde z nich wyłączyć.",
          },
          {
            q: "Czy działa między iPhone’em a Androidem?",
            a: "Tak, to jedna lista na obu. Kangur jest na iPhone’a i na telefony z Androidem, w 10 językach. Wersji na komputer nie ma.",
          },
        ],
      },
      {
        title: "Pieniądze",
        items: [
          {
            q: "Co jest za darmo?",
            a: "Listy, domownicy, alejki, tryb zakupów i 10 użyć AI na start, które się nie odnawiają. W historii widać 20 ostatnich zakończonych list. [[pricing|Cały cennik]].",
          },
          {
            q: "Co daje Premium i ile kosztuje?",
            a: "AI bez limitu i historię do 200 list, dla wszystkich osób w przestrzeni. W Polsce 9,99 zł miesięcznie, pierwszy miesiąc za darmo.",
          },
          {
            q: "Jak zrezygnować z Premium?",
            a: "W ustawieniach subskrypcji w Google Play albo App Store. Premium działa do końca opłaconego okresu.",
          },
          {
            q: "Czy w Kangurze są reklamy?",
            a: "Nie ma, ani w wersji darmowej, ani w Premium.",
          },
        ],
      },
      {
        title: "Prywatność i Kangur",
        items: [
          {
            q: "Czy Kangur czyta moje rozmowy?",
            a: "Nie. Nie ma dostępu do komunikatorów. Dostaje tylko ten obrazek, który wybierzesz. [[safety|Jakich zgód używa i czego nie robi]].",
          },
          {
            q: "Co się dzieje ze zdjęciem lub zrzutem?",
            a: "Trafia do dostawcy AI (OpenAI), który odczytuje z niego produkty. Kangur zapisuje listę, a obrazka nie.",
          },
          {
            q: "Jaka to aplikacja z kangurem na ikonie?",
            a: "Pomarańczowy kangur w turkusowej bluzie to Kangur, lista zakupów. W Google Play ma numer app.kangur, w App Store 6832296080.",
          },
          {
            q: "Czy Kangur ma związek z konkursem Kangur Matematyczny?",
            a: "Nie, to tylko ta sama nazwa. Konkurs jest dla uczniów, a nasz Kangur liczy najwyżej jajka.",
          },
          {
            q: "Jak usunąć konto?",
            a: "W aplikacji: Profil, Prywatność i bezpieczeństwo, Usuń konto. [[deleteAccount|Co dokładnie znika]]. Subskrypcję Premium anuluj osobno w sklepie.",
          },
          {
            q: "Jak się skontaktować?",
            a: "Napisz na [[mailto:contact@getkangur.com|contact@getkangur.com]] albo przez „Zgłoś problem” i „Mam pomysł” w aplikacji. Infolinii nie ma, więc nikt z Kangura do Ciebie nie dzwoni.",
          },
        ],
      },
    ],
  },
  en: {
    lines: ["Questions and answers", "about Kangur."],
    lead: "Short and without marketing. Your question is not here? [[contact|Write to us]], we usually reply within 24-48 hours.",
    groups: [
      {
        title: "Making a list",
        items: [
          { q: "How do I make a grocery list from a chat screenshot?", a: "Take a screenshot of the conversation, choose “Image” or “Screenshot” in Kangur and pick that image. Kangur creates the list, writes out items with amounts and puts them in aisles. One image at a time, and it may hold several messages." },
          { q: "Do I have to confirm what AI has read?", a: "No. Items from a photo, a screenshot or text go straight to the list, and you can change, move or delete each one. With recipes and previous lists you first untick what you do not need." },
          { q: "Will Kangur read a handwritten note?", a: "Ordinary handwriting, yes. Very messy handwriting can make it miss or mix up something, so give the list a quick look after taking the photo." },
          { q: "Can I dictate?", a: "Yes, there is a microphone in the field where you describe the list. Your phone turns speech into text and Kangur makes a list of it." },
          { q: "How does a list from a recipe work?", a: "You type the names of dishes, up to five at once. Kangur gives the ingredients of each, merges the ones that repeat, and you untick what you have at home. No recipe link needed." },
          { q: "How does Kangur know what I always buy?", a: "From your lists. It collects items from the last five and shows which ones repeat most. Star the lists that should come first." },
        ],
      },
      {
        title: "In the store",
        items: [
          { q: "What is shopping mode?", a: "A view of the list for the time you are in the store. You go aisle by aisle and swipe: right is bought, left is not there. The screen stays on. At the end you get a summary of what was bought, what was missing and how long it took." },
          { q: "Can I order the aisles like in my store?", a: "Yes. There are 24 aisles, and you drag them into your own order, saved with the list." },
          { q: "What works without signal?", a: "Ticking off items on an open list. Changes wait on the phone and are sent when you come back to the app with internet. Creating and editing lists and AI need the internet." },
        ],
      },
      {
        title: "Shared lists",
        items: [
          { q: "How do I add another person?", a: "Invite them to your space by email. The invitation is valid for 7 days and works for the address it was sent to. It is easiest when the other person installs Kangur first and signs up with that address." },
          { q: "How many people can use one list?", a: "As many as you like. There is no limit on people or spaces, also without Premium." },
          { q: "How fast does the other person see a change?", a: "On an open list after a few seconds, in shopping mode after ten to twenty. If the app is closed, the change shows when it is opened." },
          { q: "What does Kangur notify about?", a: "Invitations, and somebody starting or finishing shopping. You can also switch on notifications about new and deleted lists, and switch off any of them." },
          { q: "Does it work between iPhone and Android?", a: "Yes, it is the same list on both. Kangur is for iPhone and Android phones, in 10 languages. There is no computer version." },
        ],
      },
      {
        title: "Money",
        items: [
          { q: "What is free?", a: "Lists, your household, aisles, shopping mode and 10 AI uses to start, which do not renew. The history shows the last 20 finished lists. [[pricing|Full price list]]." },
          { q: "What does Premium add and what does it cost?", a: "Unlimited AI and a history of up to 200 lists, for everyone in the space. The store shows the price in your currency; in Poland it is 9.99 PLN a month with the first month free." },
          { q: "How do I cancel Premium?", a: "In the subscription settings of Google Play or the App Store. Premium works until the end of the paid period." },
          { q: "Are there ads in Kangur?", a: "No, neither in the free version nor in Premium." },
        ],
      },
      {
        title: "Privacy and Kangur",
        items: [
          { q: "Does Kangur read my conversations?", a: "No. It has no access to messengers and gets only the image you pick. [[safety|Which permissions it uses and what it never does]]." },
          { q: "What happens to my photo or screenshot?", a: "It goes to the AI provider (OpenAI), which reads the items from it. Kangur keeps the list and not the image." },
          { q: "Which app has a kangaroo on its icon?", a: "The orange kangaroo in a teal hoodie is Kangur, the grocery list. Its number is app.kangur in Google Play and 6832296080 in the App Store." },
          { q: "Is Kangur connected to the Kangaroo maths contest?", a: "No, they only share an animal. The contest is for students, and our Kangur counts eggs at most." },
          { q: "How do I delete my account?", a: "In the app: Profile, Privacy & security, Delete account. [[deleteAccount|What exactly is removed]]. Cancel a Premium subscription separately in the store." },
          { q: "How do I get in touch?", a: "Write to [[mailto:contact@getkangur.com|contact@getkangur.com]] or use the feedback form in the app. There is no hotline, so nobody from Kangur calls you." },
        ],
      },
    ],
  },
};

export const FAQ = { pl: typesetCopy(COPY.pl), en: COPY.en };

export function faqItems(locale: "pl" | "en") {
  return FAQ[locale].groups.flatMap((group) => group.items);
}
