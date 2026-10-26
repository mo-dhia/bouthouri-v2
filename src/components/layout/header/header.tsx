import Link from "next/link";
import Image from "next/image";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routing";
import MotionToggle from "@/components/motion-toggle/motion-toggle";
import styles from "./header.module.css";

export default function Header({ locale, dictionary: copy }: { locale: Locale; dictionary: Dictionary }) {
  const otherLocale = locale === "en" ? "ar" : "en";
  return (
    <header className={styles.header}>
      <Link href={`/${locale}`} className={styles.wordmark} aria-label={copy.navigation.home}><Image src="/assets/images/gazzar-logo.svg" alt="" width={280} height={140} unoptimized /></Link>
      <nav aria-label={copy.navigation.label}>
        <a href="#perspective">{copy.navigation.vision}</a>
        <MotionToggle labels={copy.motion} />
        <Link href={`/${otherLocale}`} hrefLang={otherLocale} lang={otherLocale} prefetch={false} aria-label={copy.navigation.languageLabel}>{copy.navigation.language}</Link>
      </nav>
    </header>
  );
}
