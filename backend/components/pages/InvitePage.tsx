import { StoreButtons } from "@/components/marketing/StoreButtons";
import { InviteOpen, InviteQr } from "@/components/pages/InviteOpen";
import { PageHero } from "@/components/site/PageHero";
import { Sticker } from "@/components/site/Sticker";
import prose from "@/components/site/prose.module.css";
import { homeCopy } from "@/lib/marketing/content/home";
import { inviteCopy } from "@/lib/marketing/content/invite";
import type { AppLocale } from "@/lib/marketing/locale";
import { routeHref } from "@/lib/marketing/routes";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/marketing/site";

import styles from "./InvitePage.module.css";

/**
 * Where the invitation e-mail leads, for people who do not have Kangur yet. The same HTML
 * for everyone: the token stays in the browser (lib/marketing/invite.ts).
 */
export function InvitePage({
  locale,
  appBase,
}: {
  locale: AppLocale;
  /** `kangur://invite` in the stores, `kangur-dev://invite` in the development build. */
  appBase: string;
}) {
  const c = inviteCopy(locale);
  const { hero } = homeCopy(locale);

  return (
    <div data-full>
      <PageHero
        locale={locale}
        crumbs={[{ label: c.crumb, href: routeHref("invite", locale) }]}
        lines={c.lines}
        lead={<p>{c.lead}</p>}
        art={<Sticker name="kciuki" className={styles.kangur} priority="desktop" />}
      />

      <section className={prose.section}>
        <div className={prose.wrap}>
          <h2 className={styles.title}>{c.title}</h2>
          <InviteQr title={c.computer.title} body={c.computer.body} label={c.computer.label} />

          <ol className={styles.steps}>
            <li className={styles.step}>
              <h3>
                <span className={styles.number} aria-hidden>
                  1
                </span>
                {c.install.title}
              </h3>
              <p>{c.install.body}</p>
              <StoreButtons
                appStoreUrl={APP_STORE_URL}
                playStoreUrl={PLAY_STORE_URL}
                appStoreSmall={hero.iosSmall}
                playSmall={hero.playSmall}
                page="zaproszenie"
              />
            </li>
            <li className={styles.step}>
              <h3>
                <span className={styles.number} aria-hidden>
                  2
                </span>
                {c.open.title}
              </h3>
              <p>{c.open.body}</p>
              <InviteOpen base={appBase} label={c.open.button} missing={c.missing} />
            </li>
            <li className={styles.step}>
              <h3>
                <span className={styles.number} aria-hidden>
                  3
                </span>
                {c.join.title}
              </h3>
              <p>{c.join.body}</p>
            </li>
          </ol>

          <p className={styles.expiry}>{c.expiry}</p>
        </div>
      </section>
    </div>
  );
}
