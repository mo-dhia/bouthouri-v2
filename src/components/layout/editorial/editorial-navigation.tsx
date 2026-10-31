import "server-only";
import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import { LanguageLink, MenuButton, SoundButton } from "../header/header";
import IdentityLogo from "../header/identity-logo";
import { getShellCopy } from "../header/shell-copy";
import header from "../header/header.module.css";
import styles from "./editorial.module.css";

/** A case page names its place in the projects and links back to it, as the original's case header did. */
export type EditorialContext = { label: string; detail: string; back: { href: string; label: string } };

/** Page-specific navigation CSS stays outside HOME's server import graph. */
export default function EditorialNavigation({ locale, route, context }: { locale: Locale; route: string; context?: EditorialContext }) {
  const copy = getShellCopy(locale);
  return <nav className={`editorial-nav ${styles.navigation}`} data-hero-utilities="true" aria-label={copy.navigation}>
    <div className={styles.identity}>
      <Link href={`/${locale}`} className={header.logo} aria-label={copy.home} data-home-link="true" data-material-sound="true"><IdentityLogo /></Link>
      <span className={styles.role}>{context ? <><span>{context.label}</span><small>{context.detail}</small></> : copy.roleLines.map(line => <span key={line}>{line}</span>)}</span>
    </div>
    <div className={styles.actions}>{context && <a href={context.back.href} className={styles.back} data-material-sound="true">{context.back.label}<i aria-hidden="true" /></a>}<div className={styles.controls}><LanguageLink locale={locale} copy={copy} route={route} /><SoundButton copy={copy} /></div><MenuButton copy={copy} /></div>
  </nav>;
}
