import "server-only";

import KineticLink from "@/components/layout/header/kinetic-link";
import { brand } from "@/config/brand";
import type { Locale } from "@/i18n/routing";
import ContactGate from "./contact-gate";
import ContactForm from "./contact-form";
import { contactCopy } from "./contact.content";
import styles from "./contact.module.css";

function Lines({ lines, opening = false }: { lines: readonly string[]; opening?: boolean }) {
  return lines.map((line) => (
    <span key={line} className={`${styles["editorial-line"]} editorial-line`}>
      <span data-opening-line={opening || undefined} data-route-line={opening || undefined} data-contact-line="true">{line}</span>
    </span>
  ));
}

export default function ContactPage({ locale }: { locale: Locale }) {
  const copy = contactCopy[locale];
  return (
    <div id="contact-content" className={styles.content} data-contact-content="true" data-locale={locale}>
      <header
        data-route-hero="true"
        data-contact-opening="true"
        className={`${styles["editorial-opening"]} ${styles["contact-opening"]} editorial-opening contact-opening`}
      >
        <div className={`${styles["editorial-kicker"]} editorial-kicker`} data-route-support="true"><span>{copy.index}</span></div>
        <h1 id="contact-question" className={`${styles["contact-question"]} contact-question`}><Lines lines={copy.hero} opening /></h1>
        <div className={styles["contact-intro"]}>
          <p data-route-support="true">{copy.intro}</p>
          <div>
            <span className={`${styles["editorial-eyebrow"]} editorial-eyebrow`}>{copy.direct}</span>
            <a className={styles["contact-email"]} href={`mailto:${brand.email}`} dir="ltr" data-material-sound="true">{brand.email}</a>
          </div>
        </div>
        <a href="#conversation" className={styles["contact-begin"]} data-contact-begin="true">
          {copy.begin}<span className={styles["contact-axis"]} data-contact-axis="true" aria-hidden="true" />
        </a>
      </header>
      <ContactForm copy={copy} />
      <section
        className={`${styles["contact-alternative"]} ${styles["editorial-section"]} contact-alternative`}
        data-editorial-reveal="true"
        data-contact-alternative="true"
        aria-labelledby="contact-alternative-title"
      >
        <div>
          <span className={`${styles["editorial-eyebrow"]} editorial-eyebrow`}>{copy.alternative.index}</span>
          <h2 id="contact-alternative-title"><Lines lines={copy.alternative.title} /></h2>
          <p>{copy.alternative.copy}</p>
        </div>
        <div className={styles["contact-calendar"]}>
          <KineticLink
            href={brand.calendarUrl}
            target={brand.calendarUrl.startsWith("https:") ? "_blank" : undefined}
            rel={brand.calendarUrl.startsWith("https:") ? "noopener noreferrer" : undefined}
            className={styles["contact-booking"]}
          >
            <span className={styles["contact-booking-title"]}>{copy.alternative.book}</span>
            <span className={styles["contact-booking-copy"]}>{copy.alternative.bookingCopy}</span>
          </KineticLink>
        </div>
      </section>
      <ContactGate locale={locale} />
    </div>
  );
}
