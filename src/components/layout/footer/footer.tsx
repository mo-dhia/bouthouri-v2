import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routing";
import { getShellCopy, shellEmail, shellLinkedIn } from "../header/shell-copy";
import FooterAnimateGate from "./footer-animate-gate";
import styles from "./footer.module.css";

/** This is the single footer, inserted inside the journey's original .systems-story. */
export default function Footer({
  copy,
  locale: suppliedLocale,
}: {
  copy: Dictionary["footer"];
  locale?: Locale;
}) {
  const locale =
    suppliedLocale ?? (copy.copyright === "محمد الجزار" ? "ar" : "en");
  const labels = getShellCopy(locale);
  return (
    <footer
      className={`home-footer global-footer ${styles.footer}`}
      data-footer-variant="home"
      data-gazzar-footer="true"
      aria-label={labels.footerThought}
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
    >
      <FooterAnimateGate />
      <div className="footer-information" data-footer-reveal="true">
        <div className="footer-direct">
          <span className="footer-label">{labels.contact}</span>
          <a
            className="footer-link footer-email"
            href={`mailto:${shellEmail}`}
            data-material-sound="true"
          >
            <bdi>{shellEmail}</bdi>
          </a>
          <p>{labels.footerThought}</p>
        </div>
        <div className="footer-navigation">
          <span className="footer-label">{labels.footerExplore}</span>
          <nav aria-label={labels.footerExplore}>
            {labels.items.map((item) => (
              <a
                href={`/${locale}/${item.route}`}
                className="footer-link"
                key={item.route}
                data-material-sound="true"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="footer-clock">
          <span className="footer-label">{labels.footerTime}</span>
          <time dir="ltr" data-footer-clock="Africa/Cairo">
            --:--
          </time>
        </div>
      </div>
      <div
        className={`footer-word-mask ${styles.word}`}
        dir="ltr"
        role="button"
        tabIndex={0}
        aria-label={labels.footerGrab}
        aria-keyshortcuts="Enter Space Escape"
        data-footer-grab="true"
      >
        <div className="footer-word-text" data-footer-word="true" dir="ltr">
          GAZZAR
        </div>
      </div>
      <span
        className="footer-thought"
        data-footer-thought="true"
        aria-live="polite"
        aria-atomic="true"
      />
      <div className="footer-colophon" data-footer-reveal="true" dir="ltr">
        <div className="footer-socials">
          <a
            className="footer-link"
            href={shellLinkedIn}
            rel="noopener noreferrer"
            target="_blank"
          >
            <bdi lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
              {labels.linkedIn}
            </bdi>
          </a>
        </div>
        <small dir={locale === "ar" ? "rtl" : "ltr"}>
          <bdi dir="ltr">© 2026</bdi>
          <span>{labels.owner}</span>
        </small>
      </div>
    </footer>
  );
}
