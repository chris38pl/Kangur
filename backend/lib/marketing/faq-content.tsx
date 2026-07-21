import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { AppLocale } from "@/lib/marketing/locale";
import { legalLocale, withLocale } from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";

type Props = { locale: AppLocale };

type FaqIconId =
  | "sparkles"
  | "sync"
  | "users"
  | "bag"
  | "camera"
  | "offline"
  | "crown"
  | "card"
  | "shield"
  | "headset";

type FaqItem = { icon: FaqIconId; q: string; a: ReactNode };

const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "contact@getkangur.com";

function FaqIcon({ id }: { id: FaqIconId }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 22,
    height: 22,
    fill: "none",
    "aria-hidden": true as const,
  };
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (id) {
    case "sparkles":
      return (
        <svg {...common}>
          <path
            d="M12 3.5 13.4 8.6 18.5 10 13.4 11.4 12 16.5 10.6 11.4 5.5 10 10.6 8.6 12 3.5Z"
            {...stroke}
          />
          <path d="M18 3.5v3M19.5 5h-3" {...stroke} />
          <path d="M6 16.5v2.5M7.25 17.75H4.75" {...stroke} />
        </svg>
      );
    case "sync":
      return (
        <svg {...common}>
          <path d="M19.5 8.5A7.5 7.5 0 0 0 6.2 6.2L4.5 8" {...stroke} />
          <path d="M4.5 4.5v3.5H8" {...stroke} />
          <path d="M4.5 15.5a7.5 7.5 0 0 0 13.3 2.3L19.5 16" {...stroke} />
          <path d="M19.5 19.5v-3.5H16" {...stroke} />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" {...stroke} />
          <path d="M3.5 18.5c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" {...stroke} />
          <circle cx="16.5" cy="8.5" r="2.5" {...stroke} />
          <path d="M15 13.6c1.9.4 3.5 1.9 3.5 4.9" {...stroke} />
        </svg>
      );
    case "bag":
      return (
        <svg {...common}>
          <path
            d="M6.5 8.5h11l-.8 10.2a1.5 1.5 0 0 1-1.5 1.3H8.8a1.5 1.5 0 0 1-1.5-1.3L6.5 8.5Z"
            {...stroke}
          />
          <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" {...stroke} />
        </svg>
      );
    case "camera":
      return (
        <svg {...common}>
          <path
            d="M4.5 8.5h3l1.2-1.8h6.6l1.2 1.8h3v9.5h-15V8.5Z"
            {...stroke}
          />
          <circle cx="12" cy="13" r="3" {...stroke} />
        </svg>
      );
    case "offline":
      return (
        <svg {...common}>
          <path d="M5 12.5a9 9 0 0 1 14 0" {...stroke} />
          <path d="M8 15.5a5 5 0 0 1 8 0" {...stroke} />
          <circle cx="12" cy="18.5" r="1.1" fill="currentColor" stroke="none" />
          <path d="M5 5.5 19 19.5" {...stroke} />
        </svg>
      );
    case "crown":
      return (
        <svg {...common}>
          <path
            d="M4.5 17.5h15l-1.2-8.5-3.8 3.2L12 6.5l-2.5 5.7-3.8-3.2L4.5 17.5Z"
            {...stroke}
          />
          <path d="M5.5 17.5h13" {...stroke} />
        </svg>
      );
    case "card":
      return (
        <svg {...common}>
          <rect x="3.5" y="6.5" width="17" height="11" rx="2" {...stroke} />
          <path d="M3.5 10.5h17" {...stroke} />
          <path d="M7 14.5h4" {...stroke} />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path
            d="M12 3.5 19 6.5v5.2c0 4.3-2.9 7.4-7 8.8-4.1-1.4-7-4.5-7-8.8V6.5L12 3.5Z"
            {...stroke}
          />
          <path d="m9.2 12.2 1.9 1.9 3.8-3.9" {...stroke} />
        </svg>
      );
    case "headset":
      return (
        <svg {...common}>
          <path d="M5 14.5v-2a7 7 0 0 1 14 0v2" {...stroke} />
          <path d="M5 14.5h2.5v4H5a1.5 1.5 0 0 1-1.5-1.5v-1A1.5 1.5 0 0 1 5 14.5Z" {...stroke} />
          <path d="M19 14.5h-2.5v4H19a1.5 1.5 0 0 0 1.5-1.5v-1A1.5 1.5 0 0 0 19 14.5Z" {...stroke} />
          <path d="M16.5 18.5h-3.2a1.3 1.3 0 0 0 0 2.6H14" {...stroke} />
        </svg>
      );
  }
}

function Chevron() {
  return (
    <svg
      className="mkt-faq-chevron"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      fill="none"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FaqContent({ locale }: Props) {
  const ui = getMessages(locale);
  const lang = legalLocale(locale);
  const contactHref = withLocale(locale, "/contact");
  const deleteHref = withLocale(locale, "/delete-account");
  const privacyHref = withLocale(locale, "/privacy");
  const faq = ui.faq;

  const items: FaqItem[] =
    lang === "pl"
      ? [
          {
            icon: "sparkles",
            q: "Jak działa AI Asystent w Kangurze?",
            a: (
              <>
                AI pomaga zamienić tekst, notatki i zrzuty ekranu w propozycje
                produktów na liście. Przeglądasz wyniki, poprawiasz je i
                zatwierdzasz - ostateczna decyzja zawsze należy do Ciebie.
                Funkcje AI zużywają AI Credits w Workspace.
              </>
            ),
          },
          {
            icon: "sync",
            q: "Czy moje listy są synchronizowane na wszystkich urządzeniach?",
            a: (
              <>
                Tak. Po zalogowaniu listy w Workspace są synchronizowane między
                urządzeniami. Zmiany podczas zakupów mogą pojawiać się na żywo -
                bez ręcznego odświeżania.
              </>
            ),
          },
          {
            icon: "users",
            q: "Jak udostępnić listę zakupów innym osobom?",
            a: (
              <>
                Zapraszasz osoby do Workspace (np. e-mailem). Współdzielicie
                listy i ich zawartość zgodnie z uprawnieniami członków
                przestrzeni - idealne do zakupów w domu lub z rodziną.
              </>
            ),
          },
          {
            icon: "bag",
            q: "Czym jest Tryb zakupów?",
            a: (
              <>
                Tryb zakupów to widok listy przygotowany do sklepu - wygodny na
                jednej ręce, z aktualizacjami na żywo, gdy ktoś z Workspace coś
                dopisze lub odhaczy.
              </>
            ),
          },
          {
            icon: "camera",
            q: "Czy mogę dodawać produkty ze zdjęć lub mową?",
            a: (
              <>
                Możesz importować produkty z tekstu oraz ze zdjęć / zrzutów
                ekranu dzięki AI. Import głosowy jest w planach - na razie
                skorzystaj z tekstu lub zdjęcia.
              </>
            ),
          },
          {
            icon: "offline",
            q: "Czy Kangur działa offline?",
            a: (
              <>
                Podstawowe korzystanie z list działa też przy słabym łączu -
                zmiany mogą czekać w kolejce i zsynchronizować się po powrocie
                sieci. Funkcje AI i pełna synchronizacja wymagają połączenia z
                internetem.
              </>
            ),
          },
          {
            icon: "crown",
            q: "Jakie są limity w darmowej wersji?",
            a: (
              <>
                Na planie Free masz miesięczny limit AI Credits (domyślnie 30) i
                ograniczoną historię list (ostatnie 20 zakończonych). Premium
                odblokowuje nielimitowane AI Credits (fair use), pełniejszą
                historię oraz generowanie listy na podstawie historii zakupów.
              </>
            ),
          },
          {
            icon: "card",
            q: "Jak anulować subskrypcję Premium?",
            a: (
              <>
                Subskrypcję anulujesz w miejscu, w którym ją kupiłeś(-aś): w
                aplikacji Kangur (portal Stripe / zarządzanie subskrypcją) albo w
                ustawieniach subskrypcji Google Play / App Store, jeśli płatność
                poszła przez sklep.
              </>
            ),
          },
          {
            icon: "card",
            q: "Jakie metody płatności akceptujecie?",
            a: (
              <>
                Płatności Premium obsługuje Stripe (karty i metody dostępne w
                Checkout) oraz sklepy z aplikacjami (Google Play / App Store),
                gdy subskrypcję uruchomisz tam. Aktualną cenę zobaczysz w
                aplikacji.
              </>
            ),
          },
          {
            icon: "shield",
            q: "Czy moje dane są bezpieczne?",
            a: (
              <>
                Dbamy o bezpieczeństwo konta i danych zgodnie z{" "}
                <Link href={privacyHref}>Polityką prywatności</Link>. Nie
                prosimy o hasła ani pełne dane karty poza bezpiecznymi
                procesami płatności (Stripe / sklepy).
              </>
            ),
          },
          {
            icon: "headset",
            q: "Jak skontaktować się z pomocą techniczną?",
            a: (
              <>
                Napisz na{" "}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a> albo
                skorzystaj ze strony{" "}
                <Link href={contactHref}>Kontakt</Link>. Konto usuniesz w
                aplikacji - szczegóły:{" "}
                <Link href={deleteHref}>Usunięcie konta</Link>.
              </>
            ),
          },
        ]
      : [
          {
            icon: "sparkles",
            q: "How does the AI Assistant work in Kangur?",
            a: (
              <>
                AI helps turn text, notes, and screenshots into product
                suggestions for your list. You review, edit, and confirm - the
                final decision is always yours. AI features use AI Credits in
                your Workspace.
              </>
            ),
          },
          {
            icon: "sync",
            q: "Are my lists synced across all devices?",
            a: (
              <>
                Yes. After you sign in, Workspace lists sync across your
                devices. While shopping, changes can appear live - without a
                manual refresh.
              </>
            ),
          },
          {
            icon: "users",
            q: "How do I share a shopping list with others?",
            a: (
              <>
                Invite people to a Workspace (e.g. by email). You share lists
                and their contents according to member permissions - great for
                home or family shopping.
              </>
            ),
          },
          {
            icon: "bag",
            q: "What is Shopping Mode?",
            a: (
              <>
                Shopping Mode is a list view built for the store - comfortable
                one-handed use, with live updates when someone in the Workspace
                adds or checks off items.
              </>
            ),
          },
          {
            icon: "camera",
            q: "Can I add products from photos or speech?",
            a: (
              <>
                You can import products from text and from photos / screenshots
                with AI. Voice import is on the roadmap - for now use text or a
                photo.
              </>
            ),
          },
          {
            icon: "offline",
            q: "Does Kangur work offline?",
            a: (
              <>
                Basic list use still works on a weak connection - changes may
                queue and sync when you’re back online. AI features and full
                sync need an internet connection.
              </>
            ),
          },
          {
            icon: "crown",
            q: "What are the limits on the free plan?",
            a: (
              <>
                Free includes a monthly AI Credits limit (default 30) and limited
                list history (last 20 finished lists). Premium unlocks unlimited
                AI Credits (fair use), fuller history, and generating a list
                from shopping history.
              </>
            ),
          },
          {
            icon: "card",
            q: "How do I cancel a Premium subscription?",
            a: (
              <>
                Cancel where you subscribed: in the Kangur app (Stripe customer
                portal / subscription management) or in Google Play / App Store
                subscription settings if you paid through the store.
              </>
            ),
          },
          {
            icon: "card",
            q: "What payment methods do you accept?",
            a: (
              <>
                Premium payments are handled by Stripe (cards and methods
                available in Checkout) and by the app stores (Google Play / App
                Store) when you subscribe there. See the current price in the
                app.
              </>
            ),
          },
          {
            icon: "shield",
            q: "Is my data safe?",
            a: (
              <>
                We protect accounts and data as described in our{" "}
                <Link href={privacyHref}>{ui.nav.privacy}</Link>. We never ask
                for passwords or full card details outside secure payment flows
                (Stripe / stores).
              </>
            ),
          },
          {
            icon: "headset",
            q: "How do I contact support?",
            a: (
              <>
                Email{" "}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a> or use the{" "}
                <Link href={contactHref}>{ui.nav.contact}</Link> page. To delete
                your account in the app, see{" "}
                <Link href={deleteHref}>{ui.nav.deleteAccount}</Link>.
              </>
            ),
          },
        ];

  return (
    <section className="mkt-faq">
      <header className="mkt-faq-header">
        <h1>{faq.title}</h1>
        {locale !== "en" && lang === "en" ? (
          <p className="mkt-meta">{faq.metaEnNote}</p>
        ) : (
          <p className="mkt-meta">{faq.meta}</p>
        )}
      </header>

      <div className="mkt-faq-list">
        {items.map((item) => (
          <details key={item.q} className="mkt-faq-item">
            <summary>
              <span className="mkt-faq-icon" aria-hidden>
                <FaqIcon id={item.icon} />
              </span>
              <span className="mkt-faq-q">{item.q}</span>
              <Chevron />
            </summary>
            <div className="mkt-faq-answer">{item.a}</div>
          </details>
        ))}
      </div>

      <aside className="mkt-faq-cta">
        <div className="mkt-faq-cta-visual">
          <Image
            src="/kangur-faq-support.webp"
            alt={faq.mascotAlt}
            width={420}
            height={280}
            className="mkt-faq-cta-mascot"
            unoptimized
            priority
          />
        </div>
        <div className="mkt-faq-cta-copy">
          <h2>{faq.ctaTitle}</h2>
          <p>{faq.ctaBody}</p>
        </div>
        <div className="mkt-faq-cta-action">
          <Link href={contactHref} className="mkt-btn mkt-btn-primary mkt-faq-cta-btn">
            {faq.ctaButton}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </aside>
    </section>
  );
}
