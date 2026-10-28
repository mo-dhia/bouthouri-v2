import "server-only";
import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import { LanguageLink, MenuButton, SoundButton } from "../header/header";
import IdentityLogo from "../header/identity-logo";
import { getShellCopy } from "../header/shell-copy";
import header from "../header/header.module.css";
import styles from "./editorial.module.css";

/** Page-specific navigation CSS stays outside HOME's server import graph. */
export default function EditorialNavigation({ locale, route }: { locale: Locale; route: string }) {
  const copy = getShellCopy(locale);
  return <nav className={`editorial-nav ${styles.navigation}`} data-hero-utilities="true" aria-label={copy.navigation}>
    <div className={styles.identity}>
      <Link href={`/${locale}`} className={header.logo} aria-label={copy.home} data-home-link="true" data-material-sound="true"><IdentityLogo /></Link>
      <span className={styles.role}>{copy.roleLines.map(line => <span key={line}>{line}</span>)}</span>
    </div>
    <div className={styles.actions}><div className={styles.controls}><LanguageLink locale={locale} copy={copy} route={route} /><SoundButton copy={copy} /></div><MenuButton copy={copy} /></div>
  </nav>;
}
