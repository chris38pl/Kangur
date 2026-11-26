import Link from "next/link";

import type { AppLocale } from "@/lib/marketing/locale";
import { legalLocale, withLocale } from "@/lib/marketing/locale";
import {
  LegalControllerParagraphEn,
  LegalControllerParagraphPl,
} from "@/lib/marketing/legal-entity";
import { getMessages } from "@/lib/marketing/messages";

type Props = { locale: AppLocale };

export function PrivacyContent({ locale }: Props) {
  const ui = getMessages(locale);
  const lang = legalLocale(locale);
  const contactHref = withLocale(locale, "/contact");
  const deleteHref = withLocale(locale, "/delete-account");
  const termsHref = withLocale(locale, "/terms");

  if (lang === "pl") {
    return (
      <article className="mkt-legal">
        <h1>Polityka prywatności</h1>
        <p className="mkt-meta">Ostatnia aktualizacja: 26 listopada 2026</p>

        <p>
          Niniejsza polityka opisuje, jak Kangur („my”, „aplikacja”) przetwarza
          dane osobowe użytkowników aplikacji mobilnej i powiązanych usług.
          Korzystając z Kangura, potwierdzasz zapoznanie się z niniejszą
          Polityką prywatności.
        </p>

        <h2>1. Administrator</h2>
        <LegalControllerParagraphPl contactHref={contactHref} />

        <h2>2. Jakie dane zbieramy</h2>
        <ul>
          <li>
            <strong>Konto:</strong> adres e-mail, identyfikator konta (np.
            Clerk), podstawowe dane profilu potrzebne do logowania.
          </li>
          <li>
            <strong>Treści użytkownika:</strong> listy zakupów, pozycje,
            notatki, ustawienia przestrzeni (workspace), historia list.
          </li>
          <li>
            <strong>Workspace:</strong> listy zakupów i ich zawartość są
            widoczne dla członków tej samej przestrzeni roboczej (Workspace),
            zgodnie z nadanymi uprawnieniami.
          </li>
          <li>
            <strong>Płatności:</strong> status subskrypcji Premium; w
            aplikacji płatności obsługują Google Play i App Store, a Kangur nie
            otrzymuje numeru karty.
          </li>
          <li>
            <strong>Techniczne:</strong> tokeny urządzeń push, logi i dane
            diagnostyczne, informacje o awariach oraz statystyki użycia
            przypisane do numeru konta, bez nazw produktów i bez nagrywania
            ekranu - w celu bezpieczeństwa, jakości i stabilności działania.
          </li>
          <li>
            <strong>AI:</strong> treści list, tekst lub zrzuty ekranu
            przetwarzamy wyłącznie po to, by wykonać wybraną funkcję AI (np.
            rozpoznanie listy ze screena). Do modeli AI nie przekazujemy
            celowo danych identyfikujących użytkownika - wyjątkiem jest sytuacja,
            gdy użytkownik sam umieści takie dane w przesłanej treści. Dostawca
            AI (OpenAI) przechowuje przesłane treści według swoich zasad.
          </li>
        </ul>

        <h2>3. Cele przetwarzania danych</h2>
        <p>
          Dane przetwarzamy na podstawie wykonania umowy, uzasadnionego
          interesu administratora oraz obowiązków wynikających z przepisów
          prawa.
        </p>
        <ul>
          <li>Świadczenie i utrzymanie usługi.</li>
          <li>
            Bezpieczeństwo, zapobieganie nadużyciom, rozliczanie limitów AI.
          </li>
          <li>Obsługa płatności i uprawnień Premium.</li>
          <li>Kontakt wsparcia na Twoją prośbę.</li>
          <li>
            Wymogi prawne (np. księgowość, odpowiedzi organom - gdy jest to
            wymagane).
          </li>
        </ul>

        <h2>4. Udostępnianie</h2>
        <p>
          Dane mogą być przetwarzane przez zaufanych dostawców wyłącznie w
          zakresie niezbędnym do działania aplikacji: Clerk (logowanie), Neon
          (baza danych), Vercel (hosting), Google Play i App Store (płatności),
          OpenAI (funkcje AI), PostHog (statystyki), Sentry (błędy), Expo
          (powiadomienia), UploadThing (zdjęcie w profilu i załączniki do
          zgłoszeń), Resend (e-mail). Nie sprzedajemy Twoich danych osobowych.
        </p>
        <p>
          Niektórzy dostawcy mogą przetwarzać dane poza Europejskim Obszarem
          Gospodarczym. Korzystamy wyłącznie z dostawców stosujących odpowiednie
          mechanizmy ochrony danych wymagane przez obowiązujące przepisy.
        </p>

        <h2>5. Przechowywanie i bezpieczeństwo</h2>
        <p>
          Dane przechowujemy tak długo, jak jest to potrzebne do świadczenia
          usługi lub spełnienia obowiązków prawnych. Stosujemy standardowe
          środki ochrony (szyfrowanie w transporcie, kontrola dostępu). Żaden
          system nie jest w 100% bezpieczny - zgłaszaj podejrzenia naruszeń
          przez <Link href={contactHref}>Kontakt</Link>.
        </p>

        <h2>6. Twoje prawa</h2>
        <p>
          W zależności od obowiązującego prawa możesz mieć prawo do dostępu,
          sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia
          danych oraz sprzeciwu. Aby usunąć konto, zobacz{" "}
          <Link href={deleteHref}>Usunięcie konta</Link>. Możesz też złożyć
          skargę do właściwego organu ochrony danych osobowych.
        </p>

        <h2>7. Strona internetowa</h2>
        <p>
          Strona internetowa wykorzystuje wyłącznie technologie niezbędne do
          jej działania. Gdy wchodzisz z linku z oznaczeniem kampanii, na
          przykład z reklamy, strona pamięta to oznaczenie w tej karcie
          przeglądarki, żeby przekazać je do sklepu z aplikacjami. Darmowe
          narzędzia i kalkulatory zapisują Twoją listę tylko w pamięci Twojej
          przeglądarki i jej nie wysyłają. Jeżeli w przyszłości wdrożymy
          narzędzia analityczne lub marketingowe oparte na plikach cookies,
          zaktualizujemy tę politykę.
        </p>

        <h2>8. Dzieci</h2>
        <p>
          Kangur nie jest skierowany do dzieci poniżej 16. roku życia. Nie
          zbieramy świadomie danych dzieci.
        </p>

        <h2>9. Zmiany</h2>
        <p>
          Możemy aktualizować tę politykę. Istotne zmiany opublikujemy na tej
          stronie z nową datą „Ostatnia aktualizacja”.
        </p>
        <p>
          Powiązane strony:{" "}
          <Link href={termsHref}>Regulamin</Link>,{" "}
          <Link href={deleteHref}>Usunięcie konta</Link>,{" "}
          <Link href={contactHref}>Kontakt</Link>.
        </p>
      </article>
    );
  }

  return (
    <article className="mkt-legal" lang={locale === lang ? undefined : lang}>
      <h1>Privacy Policy</h1>
      <p className="mkt-meta">
        Last updated: 26 November 2026
        {locale !== "en" ? <> · English</> : null}
      </p>

      <p>
        This policy explains how Kangur (“we”, “the app”) processes personal
        data of users of the mobile app and related services. By using Kangur,
        you confirm that you have read this Privacy Policy.
      </p>

      <h2>1. Controller</h2>
      <LegalControllerParagraphEn
        contactHref={contactHref}
        contactLabel={ui.nav.contact}
      />

      <h2>2. Data we collect</h2>
      <ul>
        <li>
          <strong>Account:</strong> email address, account identifier (e.g.
          Clerk), basic profile data needed to sign in.
        </li>
        <li>
          <strong>User content:</strong> shopping lists, items, notes, workspace
          settings, list history.
        </li>
        <li>
          <strong>Workspace:</strong> shopping lists and their contents are
          visible to members of the same workspace, subject to assigned
          permissions.
        </li>
        <li>
          <strong>Payments:</strong> Premium subscription status; in the app
          payments are handled by Google Play and the App Store, and Kangur does
          not receive your card number.
        </li>
        <li>
          <strong>Technical:</strong> push device tokens, diagnostic logs, crash
          information, and usage statistics linked to the account number, without
          product names and without screen recording - to keep the app secure,
          reliable, and improve quality.
        </li>
        <li>
          <strong>AI:</strong> list content, text, or screenshots are processed
          only to run the AI feature you choose (e.g. reading a list from a
          screenshot). We do not intentionally send identifying user data to AI
          models - except when the user themselves includes such data in the
          submitted content. The AI provider (OpenAI) stores the submitted content
          under its own rules.
        </li>
      </ul>

      <h2>3. Purposes of processing</h2>
      <p>
        We process data on the basis of performance of a contract, the
        controller’s legitimate interest, and legal obligations.
      </p>
      <ul>
        <li>Providing and maintaining the service.</li>
        <li>Security, abuse prevention, AI quota accounting.</li>
        <li>Handling payments and Premium entitlements.</li>
        <li>Support when you contact us.</li>
        <li>
          Legal requirements (e.g. accounting, responses to authorities when
          required).
        </li>
      </ul>

      <h2>4. Sharing</h2>
      <p>
        Data may be processed by trusted providers only as needed to run the
        app: Clerk (sign-in), Neon (database), Vercel (hosting), Google Play and
        the App Store (payments), OpenAI (AI features), PostHog (statistics),
        Sentry (errors), Expo (notifications), UploadThing (profile picture and
        attachments to reports), Resend (email). We do not sell your personal
        data.
      </p>
      <p>
        Some providers may process data outside the European Economic Area. In
        those cases we only use providers that apply appropriate data-protection
        safeguards required by applicable law.
      </p>

      <h2>5. Retention and security</h2>
      <p>
        We keep data as long as needed to provide the service or meet legal
        obligations. We apply standard safeguards (encryption in transit, access
        control). No system is 100% secure - report suspected incidents via{" "}
        <Link href={contactHref}>{ui.nav.contact}</Link>.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on applicable law, you may have rights to access,
        rectification, erasure, restriction, portability, and objection. To
        delete your account, see{" "}
        <Link href={deleteHref}>{ui.nav.deleteAccount}</Link>. You may also lodge
        a complaint with the competent data-protection authority.
      </p>

      <h2>7. Website</h2>
      <p>
        The website uses only technologies that are necessary for it to work.
        When you come from a link with a campaign tag, for example from an ad,
        the website remembers the tag in that browser tab to pass it on to the
        app store. The free tools and calculators keep your list only in the
        memory of your browser and do not send it. If we later introduce
        analytics or marketing tools that use cookies, we will update this
        policy.
      </p>

      <h2>8. Children</h2>
      <p>
        Kangur is not directed at children under 16. We do not knowingly collect
        children’s data.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this policy. Material changes will be posted on this page
        with a new “Last updated” date.
      </p>
      <p>
        Related pages: <Link href={termsHref}>{ui.nav.terms}</Link>,{" "}
        <Link href={deleteHref}>{ui.nav.deleteAccount}</Link>,{" "}
        <Link href={contactHref}>{ui.nav.contact}</Link>.
      </p>
    </article>
  );
}
