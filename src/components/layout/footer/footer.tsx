import "server-only";

import { brand } from "@/config/brand";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routing";
import { markPaths, markPieces, markTransform } from "../header/identity-mark";
import { getShellCopy, shellEmail, shellLinkedIn } from "../header/shell-copy";
import FooterAnimateGate from "./footer-animate-gate";
import {
  footerLetters,
  footerRipple,
  footerViewBox,
  letterTransform,
  placeTransform,
  restLetter,
  wordFrame,
} from "./footer-mark";
import styles from "./footer.module.css";

/** This is the single footer, inserted inside the journey's original .systems-story. */
export default function Footer({
  copy,
  locale,
  variant = "home",
}: {
  copy: Dictionary["footer"];
  locale: Locale;
  variant?: "home" | "standard";
}) {
  const labels = getShellCopy(locale);
  const rest = wordFrame();
  return (
    <footer
      className={`home-footer global-footer ${variant === "standard" ? "standard-footer" : ""} ${styles.footer}`}
      data-footer-variant={variant}
      data-portfolio-footer="true"
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
          <time dir="ltr" data-footer-clock={brand.location.timeZone}>
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
          {/* The word stays in the HTML for readers, search and copy without CSS. */}
          <span className={styles.text}>{brand.wordmark}</span>
          {/* The kit's bouthouri, as in the nav logo; its b is the live mark. */}
          <svg
            className={styles.svg}
            viewBox={`${footerViewBox.x} ${footerViewBox.y} ${footerViewBox.width} ${footerViewBox.height}`}
            fill="currentColor"
            aria-hidden="true"
            data-footer-svg="true"
          >
            <g data-footer-letters="true">
              {footerLetters.map((letter, index) => (
                <g
                  key={index}
                  data-footer-letter={letter.letter}
                  transform={letterTransform(restLetter(index), letter.w)}
                >
                  {letter.paths.map((d, part) => (
                    <path key={part} d={d} />
                  ))}
                </g>
              ))}
            </g>
            <g fill="none" stroke="currentColor">
              {footerRipple.delays.map((delay) => (
                <circle
                  key={delay}
                  data-footer-ripple="true"
                  r={footerRipple.radius}
                  strokeWidth="2"
                  opacity="0"
                />
              ))}
            </g>
            {/* Keyboard focus: the old word's underline, a pixel under the baseline. */}
            <line
              className={styles.focus}
              x1="0"
              x2={footerViewBox.width + 2 * footerViewBox.x}
              y1="118"
              y2="118"
              stroke="#aaa69a"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <g data-footer-mark="true" transform={placeTransform(rest.place)}>
              {markPaths.map((d, index) => (
                <path
                  key={index}
                  d={d}
                  data-footer-piece={markPieces[index]}
                  transform={markTransform(rest.pose[markPieces[index]])}
                />
              ))}
            </g>
          </svg>
        </div>
      </div>
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
          <span>{locale === "en" ? copy.copyright.toUpperCase() : copy.copyright}</span>
        </small>
      </div>
    </footer>
  );
}
