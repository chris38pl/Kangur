import { QrCode } from "@/components/site/QrCode";

import styles from "./PrintFoot.module.css";

/**
 * Corner of everything that gets printed: who made it, and where the next list can live. In
 * the corner, because at the end of a long list it would need a sheet of its own.
 */
export function PrintFoot() {
  return (
    <div className={styles.foot}>
      <p>
        <strong>Następną zróbcie w Kangurze, razem.</strong>
        <br />
        getkangur.com/pobierz
      </p>
      <QrCode code="kartka" label="Kod QR, który otwiera Kangura w sklepie z aplikacjami" />
    </div>
  );
}
