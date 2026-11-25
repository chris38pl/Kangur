import { QrCode } from "@/components/site/QrCode";

import styles from "./PrintFoot.module.css";

/** Bottom of everything that gets printed: who made it, and where the next list can live. */
export function PrintFoot() {
  return (
    <div className={styles.foot}>
      <QrCode code="kartka" label="Kod QR, który otwiera Kangura w sklepie z aplikacjami" />
      <p>
        <strong>Następną zróbcie w Kangurze, razem.</strong>
        <br />
        Wspólna lista zakupów na iPhone’a i Androida. getkangur.com/pobierz
      </p>
    </div>
  );
}
