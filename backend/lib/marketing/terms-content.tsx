import Link from "next/link";

import type { AppLocale } from "@/lib/marketing/locale";
import { legalLocale, withLocale } from "@/lib/marketing/locale";
import { getMessages } from "@/lib/marketing/messages";

type Props = { locale: AppLocale };

export function TermsContent({ locale }: Props) {
  const ui = getMessages(locale);
  const lang = legalLocale(locale);
  const contactHref = withLocale(locale, "/contact");
  const deleteHref = withLocale(locale, "/delete-account");
  const privacyHref = withLocale(locale, "/privacy");

  if (lang === "pl") {
    return (
      <article className="mkt-legal">
        <h1>Regulamin</h1>
        <p className="mkt-meta">Ostatnia aktualizacja: 21 lipca 2026</p>

        <p>
          Niniejszy regulamin określa zasady korzystania z aplikacji mobilnej
          Kangur oraz powiązanych usług online. Korzystając z Kangura,
          akceptujesz te warunki.
        </p>
        <p>
          Usługodawcą aplikacji Kangur jest Krzysztof Krawiec. Kontakt:{" "}
          <a href="mailto:support@getkangur.com">support@getkangur.com</a>.
        </p>

        <h2>1. Usługa</h2>
        <p>
          Kangur to aplikacja do wspólnych list zakupów z funkcjami takimi jak
          tryb zakupów, powiadomienia i opcjonalne funkcje AI. Aplikacja jest
          stale rozwijana, dlatego dostępne funkcje mogą ulegać zmianom.
        </p>

        <h2>2. Konto</h2>
        <ul>
          <li>Odpowiadasz za bezpieczeństwo danych logowania.</li>
          <li>Nie udostępniaj swojego konta osobom trzecim.</li>
        </ul>
        <ul>
          <li>
            Podajesz prawdziwe dane potrzebne do rejestracji i nie podszywasz
            się pod inne osoby.
          </li>
          <li>
            Możesz w dowolnym momencie zakończyć korzystanie z usługi i usunąć
            konto zgodnie z instrukcją na stronie{" "}
            <Link href={deleteHref}>Usunięcie konta</Link>.
          </li>
        </ul>

        <h2>3. Akceptowalne użycie</h2>
        <p>Zabrania się w szczególności:</p>
        <ul>
          <li>naruszania prawa lub praw osób trzecich,</li>
          <li>próby obejścia zabezpieczeń, limitów AI lub płatności,</li>
          <li>nadmiernego obciążania infrastruktury,</li>
          <li>
            przesyłania treści nielegalnych lub szkodliwych do funkcji AI /
            list.
          </li>
        </ul>

        <h2>4. Treści użytkownika</h2>
        <p>
          Zachowujesz prawa do treści, które dodajesz (listy, notatki itd.).
          Udzielasz nam licencji na ich przetwarzanie wyłącznie w celu
          świadczenia i ulepszania usługi. Współdzielone przestrzenie robocze
          (Workspace) i ich zawartość mogą być widoczne dla innych członków tej
          samej przestrzeni zgodnie z nadanymi uprawnieniami.
        </p>

        <h2>5. Premium i płatności</h2>
        <p>
          Część funkcji może wymagać subskrypcji Premium. Płatności obsługuje
          Stripe lub odpowiedni sklep z aplikacjami (np. Google Play lub App
          Store), zgodnie z wybranym kanałem. Odnowienia, anulowanie i zwroty
          podlegają zasadom danego dostawcy płatności oraz lokalnemu prawu.
        </p>

        <h2>6. AI</h2>
        <p>
          Propozycje AI mają charakter pomocniczy. Możesz je odrzucić lub
          edytować. Nie gwarantujemy poprawności ani kompletności sugestii (np.
          produktów czy kategorii). Ostateczna decyzja o wykorzystaniu sugestii
          AI należy do użytkownika.
        </p>

        <h2>7. Dostępność i odpowiedzialność</h2>
        <p>
          Dokładamy starań, aby usługa działała poprawnie i była stale
          rozwijana, jednak mogą występować przerwy techniczne, błędy lub
          ograniczenia funkcjonalności. W najszerszym zakresie dozwolonym przez
          obowiązujące przepisy prawa nie odpowiadamy za szkody pośrednie ani
          utratę danych wynikającą z przyczyn poza naszą rozsądną kontrolą.
        </p>

        <h2>8. Zmiany i kontakt</h2>
        <p>
          Możemy aktualizować regulamin; aktualna wersja jest publikowana na tej
          stronie. W razie pytań skontaktuj się z nami pod adresem{" "}
          <a href="mailto:support@getkangur.com">support@getkangur.com</a> lub
          przez stronę <Link href={contactHref}>Kontakt</Link>. Polityka
          prywatności:{" "}
          <Link href={privacyHref}>Polityka prywatności</Link>.
        </p>
      </article>
    );
  }

  return (
    <article className="mkt-legal">
      <h1>Terms of Use</h1>
      <p className="mkt-meta">
        Last updated: 21 July 2026
        {locale !== "en" ? <> · English</> : null}
      </p>

      <p>
        These terms govern use of the Kangur mobile app and related online
        services. By using Kangur, you accept these terms.
      </p>
      <p>
        The Kangur service provider is Krzysztof Krawiec. Contact:{" "}
        <a href="mailto:support@getkangur.com">support@getkangur.com</a>.
      </p>

      <h2>1. Service</h2>
      <p>
        Kangur is a shared shopping-list app with features such as shopping
        mode, notifications, and optional AI. The app is under continuous
        development, so available features may change.
      </p>

      <h2>2. Account</h2>
      <ul>
        <li>You are responsible for keeping your sign-in details secure.</li>
        <li>Do not share your account with third parties.</li>
      </ul>
      <ul>
        <li>
          You provide accurate registration information and do not impersonate
          others.
        </li>
        <li>
          You may stop using the service at any time and delete your account
          following the instructions on{" "}
          <Link href={deleteHref}>{ui.nav.deleteAccount}</Link>.
        </li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>In particular, you must not:</p>
      <ul>
        <li>violate the law or third-party rights,</li>
        <li>attempt to bypass security, AI limits, or payments,</li>
        <li>overburden infrastructure,</li>
        <li>submit illegal or harmful content to AI / lists.</li>
      </ul>

      <h2>4. User content</h2>
      <p>
        You retain rights to content you add (lists, notes, etc.). You grant us
        a license to process it solely to provide and improve the service.
        Shared workspaces and their contents may be visible to other members of
        the same workspace, subject to assigned permissions.
      </p>

      <h2>5. Premium and payments</h2>
      <p>
        Some features may require a Premium subscription. Payments are handled
        by Stripe or the relevant app store (e.g. Google Play or the App Store),
        depending on the channel. Renewals, cancellation, and refunds follow the
        payment provider’s rules and applicable law.
      </p>

      <h2>6. AI</h2>
      <p>
        AI suggestions are assistive. You may reject or edit them. We do not
        guarantee the accuracy or completeness of suggestions (e.g. products or
        categories). The final decision on using AI suggestions rests with the
        user.
      </p>

      <h2>7. Availability and liability</h2>
      <p>
        We strive to keep the service working correctly and under continuous
        development; however, technical interruptions, errors, or feature
        limitations may occur. To the fullest extent permitted by applicable
        law, we are not liable for indirect damages or data loss outside our
        reasonable control.
      </p>

      <h2>8. Changes and contact</h2>
      <p>
        We may update these terms; the current version is published on this
        page. If you have questions, contact us at{" "}
        <a href="mailto:support@getkangur.com">support@getkangur.com</a> or via
        the <Link href={contactHref}>{ui.nav.contact}</Link> page. Privacy
        Policy: <Link href={privacyHref}>{ui.nav.privacy}</Link>.
      </p>
    </article>
  );
}
