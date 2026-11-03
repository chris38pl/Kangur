import type { ReactNode } from "react";
import Link from "next/link";

/** SSOT for Kangur legal entity on marketing / legal pages. */
export const LEGAL_ENTITY = {
  firmName: "Krzysztof Krawiec Software",
  nip: "9721382309",
  regon: "545425000",
  addressPl: "ul. Sielawy 23e/19, 61-619 Poznań",
  addressEn: "ul. Sielawy 23e/19, 61-619 Poznań, Poland",
  supportEmail: "support@getkangur.com",
} as const;

export function LegalEntityLine({ locale }: { locale: string }) {
  const address =
    locale === "pl" ? LEGAL_ENTITY.addressPl : LEGAL_ENTITY.addressEn;

  return (
    <>
      {LEGAL_ENTITY.firmName}
      {" · "}
      NIP {LEGAL_ENTITY.nip}
      {" · "}
      REGON {LEGAL_ENTITY.regon}
      {" · "}
      {address}
    </>
  );
}

function SupportMailto() {
  return (
    <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>
      {LEGAL_ENTITY.supportEmail}
    </a>
  );
}

function EntityDetails({
  address,
  addressLabel,
}: {
  address: string;
  addressLabel: string;
}) {
  return (
    <>
      <strong>{LEGAL_ENTITY.firmName}</strong>, NIP {LEGAL_ENTITY.nip}, REGON{" "}
      {LEGAL_ENTITY.regon}, {addressLabel}: {address}
    </>
  );
}

/** Regulamin - usługodawca (PL). */
export function LegalProviderParagraphPl() {
  return (
    <p>
      Usługodawcą aplikacji Kangur jest{" "}
      <EntityDetails
        address={LEGAL_ENTITY.addressPl}
        addressLabel="adres"
      />
      . Kontakt: <SupportMailto />.
    </p>
  );
}

/** Terms - service provider (EN). */
export function LegalProviderParagraphEn() {
  return (
    <p>
      The Kangur service provider is{" "}
      <EntityDetails
        address={LEGAL_ENTITY.addressEn}
        addressLabel="address"
      />
      . Contact: <SupportMailto />.
    </p>
  );
}

/** Polityka - administrator (PL). */
export function LegalControllerParagraphPl({
  contactHref,
}: {
  contactHref: string;
}) {
  return (
    <p>
      Administratorem danych jest{" "}
      <EntityDetails
        address={LEGAL_ENTITY.addressPl}
        addressLabel="adres"
      />
      . Kontakt: <SupportMailto />. Możesz też napisać przez stronę{" "}
      <Link href={contactHref}>Kontakt</Link>.
    </p>
  );
}

/** Privacy - data controller (EN). */
export function LegalControllerParagraphEn({
  contactHref,
  contactLabel,
}: {
  contactHref: string;
  contactLabel: ReactNode;
}) {
  return (
    <p>
      The data controller is{" "}
      <EntityDetails
        address={LEGAL_ENTITY.addressEn}
        addressLabel="address"
      />
      . Contact: <SupportMailto />. You can also reach us via the{" "}
      <Link href={contactHref}>{contactLabel}</Link> page.
    </p>
  );
}
