import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routing";
import GazzarLogo from "./gazzar-logo";
import KineticLink from "./kinetic-link";
import NavInk from "./nav-ink";
import HeaderAnimateGate from "./header-animate-gate";
import { getShellCopy, shellEmail, shellLinkedIn } from "./shell-copy";
import styles from "./header.module.css";
import menu from "./menu.module.css";

type Copy = ReturnType<typeof getShellCopy>;

function MenuButton({ copy, close = false }: { copy: Copy; close?: boolean }) {
  return (
    <button
      type="button"
      className={menu["menu-control"]}
      data-menu-control="true"
      data-menu-close={close || undefined}
      aria-controls="portfolio-navigation"
      aria-expanded={close}
      aria-haspopup="dialog"
      aria-label={close ? copy.closeLabel : copy.open}
    >
      <span className={menu["menu-control-label"]} aria-hidden="true">
        <span className={menu["menu-label-rest"]}>
          <NavInk>{copy.menu}</NavInk>
        </span>
        <span className={menu["menu-label-open"]}>
          <NavInk>{copy.close}</NavInk>
        </span>
      </span>
    </button>
  );
}

function SoundButton({
  copy,
  labelled = false,
}: {
  copy: Copy;
  labelled?: boolean;
}) {
  return (
    <button
      type="button"
      className={styles.sound}
      data-sound-control="true"
      data-sound-labelled={labelled || undefined}
      aria-label={copy.enableSound}
      aria-pressed="false"
      title={copy.soundDisabled}
      data-label-on={copy.mute}
      data-label-off={copy.enableSound}
      data-title-on={copy.soundEnabled}
      data-title-off={copy.soundDisabled}
      data-title-error={copy.soundError}
      data-title-starting={copy.soundStarting}
      data-title-pending={copy.soundPending}
      data-sound-on={copy.soundOn}
      data-sound-off={copy.soundOff}
      data-audio-state="uninitialized"
    >
      <svg viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <path data-sound-wave="true" d="M0 13H26" />
      </svg>
      {labelled && <span data-sound-label="true">{copy.soundOff}</span>}
    </button>
  );
}

function LanguageLink({
  locale,
  copy,
  full = false,
}: {
  locale: Locale;
  copy: Copy;
  full?: boolean;
}) {
  const otherLocale = locale === "en" ? "ar" : "en";
  return (
    <Link
      href={`/${otherLocale}`}
      prefetch={false}
      hrefLang={otherLocale}
      lang={otherLocale}
      className={styles.language}
      data-language-control="true"
      aria-label={copy.languageLabel}
      title={copy.languageLabel}
    >
      <span className={styles.languageMask}>
        <span>
          <NavInk>{full ? copy.fullLanguage : copy.language}</NavInk>
        </span>
      </span>
    </Link>
  );
}

export default function Header({
  locale,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const copy = getShellCopy(locale);
  return (
    <div className={styles.shell} data-gazzar-shell="true" data-locale={locale}>
      <HeaderAnimateGate />
      <header className={styles.utilities} data-hero-utilities="true">
        <div className={styles.navEntrance} data-hero-nav-entrance="true">
          <div
            className={styles.navLayer}
            data-nav-context="hero"
            data-nav-layer="hero"
          >
            <div
              className={`${styles.navWindow} ${styles.languageWindow}`}
              data-hero-nav-window="true"
            >
              <div data-hero-nav-item="true">
                <div className={styles.navControl} data-nav-control="language">
                  <div className={styles.menuAndLanguage}>
                    <LanguageLink locale={locale} copy={copy} />
                    <MenuButton copy={copy} />
                  </div>
                </div>
              </div>
            </div>
            <div
              className={`${styles.navWindow} ${styles.logoWindow}`}
              data-hero-nav-window="true"
            >
              <div data-hero-nav-item="true">
                <div className={styles.navControl} data-nav-control="logo">
                  <Link
                    href={`/${locale}`}
                    className={styles.logo}
                    aria-label={copy.home}
                    data-home-link="true"
                    data-material-sound="true"
                  >
                    <GazzarLogo />
                  </Link>
                </div>
              </div>
            </div>
            <div
              className={`${styles.navWindow} ${styles.actionsWindow}`}
              data-hero-nav-window="true"
            >
              <div className={styles.actions} data-hero-nav-item="true">
                <div className={styles.navControl} data-nav-control="sound">
                  <SoundButton copy={copy} />
                </div>
                <div className={styles.navControl} data-nav-control="talk">
                  <KineticLink
                    href={`/${locale}/contact`}
                    variant="rollover"
                    navLabel
                    className={styles.talk}
                  >
                    {copy.talk}
                  </KineticLink>
                </div>
              </div>
            </div>
          </div>
          <div
            className={styles.navLayer}
            data-nav-context="persistent"
            data-nav-layer="persistent"
            inert
            aria-hidden="true"
          >
            <div className={styles.persistentIdentity} data-nav-mask="true">
              <div className={styles.persistentIdentityContent}>
                <div className={styles.persistentLogo} data-nav-mask="true">
                  <div data-nav-roll="true">
                    <Link
                      href={`/${locale}`}
                      className={styles.logo}
                      aria-label={copy.home}
                      data-home-link="true"
                      data-material-sound="true"
                    >
                      <GazzarLogo />
                    </Link>
                  </div>
                </div>
                <div
                  className={styles.persistentRoleWindow}
                  data-nav-mask="true"
                >
                  <div
                    className={styles.persistentRole}
                    data-nav-roll="true"
                    aria-label={copy.role}
                  >
                    {copy.roleLines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.navDock}>
              <div className={styles.utilityGroup} data-nav-mask="true">
                <div className={styles.utilityContent} data-nav-roll="true">
                  <div
                    className={styles.utilityFrame}
                    data-nav-utility-frame="true"
                  >
                    <span
                      className={styles.utilityRegistration}
                      data-nav-registration="true"
                    />
                    <span
                      className={styles.utilityRegistration}
                      data-nav-registration="true"
                    />
                  </div>
                  <LanguageLink locale={locale} copy={copy} />
                  <span className={styles.persistentSound}>
                    <SoundButton copy={copy} />
                  </span>
                </div>
              </div>
              <div className={styles.persistentTalkWindow} data-nav-mask="true">
                <div data-nav-roll="true">
                  <KineticLink
                    href={`/${locale}/contact`}
                    variant="static"
                    navLabel
                    className={`${styles.talk} ${styles.sweptTalk}`}
                  >
                    {copy.talk}
                  </KineticLink>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={styles.sideMenu}
          data-shell-side-menu="true"
          inert
          aria-hidden="true"
        >
          <div data-nav-side-roll="true">
            <MenuButton copy={copy} />
          </div>
        </div>
      </header>
      <dialog
        className={menu["navigation-scene"]}
        id="portfolio-navigation"
        aria-labelledby="menu-heading"
        dir={locale === "ar" ? "rtl" : "ltr"}
        lang={locale}
        data-lenis-prevent="true"
      >
        <div className={menu["menu-surface"]} data-menu-surface="true" />
        <div className={menu["menu-scroller"]} data-menu-scroll="true">
          <div className={menu["menu-opening-line"]} aria-hidden="true" />
          <header className={menu["menu-top"]}>
            <div className={menu["menu-identity"]}>
              <Link
                href={`/${locale}`}
                className={styles.menuLogo}
                aria-label={copy.home}
                data-home-link="true"
              >
                <GazzarLogo />
              </Link>
              <span className={menu["menu-owner"]}>
                {copy.owner}
                <span>{copy.index}</span>
              </span>
            </div>
            <div className={menu["menu-top-actions"]}>
              <MenuButton copy={copy} close />
            </div>
          </header>
          <h2 className={styles.srOnly} id="menu-heading">
            {copy.navigation}
          </h2>
          <div className={menu["menu-composition"]}>
            <nav
              className={menu["menu-primary"]}
              aria-label={copy.navigation}
              data-menu-primary="true"
            >
              <i
                className={menu["menu-primary-rail"]}
                data-menu-rail="true"
                aria-hidden="true"
              />
              {copy.items.map((item, i) => (
                <Link
                  href={`/${locale}/${item.route}`}
                  prefetch={false}
                  key={item.route}
                  className={menu["menu-primary-item"]}
                  data-menu-item={i}
                  data-selected={i === 0}
                  data-material-sound="true"
                >
                  <span
                    className={menu["menu-link-inner"]}
                    data-menu-link-inner="true"
                  >
                    <span className={menu["menu-item-number"]} dir="ltr">
                      0{i + 1}
                    </span>
                    <span className={menu["menu-item-word"]}>{item.label}</span>
                  </span>
                </Link>
              ))}
            </nav>
            <aside className={menu["menu-information"]}>
              <div className={menu["menu-secondary-mask"]}>
                <div
                  className={`${menu["menu-secondary-roll"]} ${menu["menu-preview"]}`}
                  data-menu-secondary="true"
                >
                  <div className={menu["menu-description-window"]}>
                    {copy.items.map((item, i) => (
                      <p
                        key={item.route}
                        className={menu["menu-description"]}
                        data-menu-description={i}
                        aria-hidden={i !== 0}
                      >
                        {item.description}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              <div
                className={`${menu["menu-secondary-mask"]} ${menu["menu-settings-mask"]}`}
              >
                <div
                  className={`${menu["menu-secondary-roll"]} ${menu["menu-settings"]}`}
                  data-menu-secondary="true"
                >
                  <div>
                    <span className={menu["menu-meta-label"]}>
                      {copy.languageHeading}
                    </span>
                    <LanguageLink locale={locale} copy={copy} full />
                  </div>
                  <div>
                    <span className={menu["menu-meta-label"]}>
                      {copy.soundHeading}
                    </span>
                    <SoundButton copy={copy} labelled />
                  </div>
                </div>
              </div>
              <div className={menu["menu-secondary-mask"]}>
                <div
                  className={`${menu["menu-secondary-roll"]} ${menu["menu-contact"]}`}
                  data-menu-secondary="true"
                >
                  <span className={menu["menu-meta-label"]}>
                    {copy.contact}
                  </span>
                  <a
                    href={`mailto:${shellEmail}`}
                    className={menu["menu-email"]}
                    dir="ltr"
                    data-material-sound="true"
                  >
                    {shellEmail}
                  </a>
                  <button
                    type="button"
                    className={menu["menu-copy"]}
                    data-menu-copy="true"
                    data-copy-label={copy.copy}
                    data-copied-label={copy.copied}
                    data-copy-error={copy.copyError}
                  >
                    {copy.copy}
                  </button>
                  <span
                    className={styles.srOnly}
                    role="status"
                    data-copy-status="true"
                  />
                </div>
              </div>
              <div className={menu["menu-secondary-mask"]}>
                <div
                  className={`${menu["menu-secondary-roll"]} ${menu["menu-social"]}`}
                  data-menu-secondary="true"
                >
                  <span className={menu["menu-meta-label"]}>
                    {copy.elsewhere}
                  </span>
                  <div>
                    <a
                      href={shellLinkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-material-sound="true"
                    >
                      {copy.linkedIn}
                    </a>
                  </div>
                </div>
              </div>
              <div className={menu["menu-secondary-mask"]}>
                <div
                  className={`${menu["menu-secondary-roll"]} ${menu["menu-times"]}`}
                  data-menu-secondary="true"
                >
                  <span className={menu["menu-meta-label"]}>{copy.time}</span>
                  <div className={menu["menu-time-row"]}>
                    <span>{copy.country}</span>
                    <time dir="ltr" data-shell-clock="Africa/Cairo">
                      --:--
                    </time>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <footer className={menu["menu-bottom-mask"]}>
            <div className={menu["menu-bottom-roll"]} data-menu-bottom="true">
              <span>{copy.roleFooter}</span>
              <span dir="ltr">© 2026</span>
            </div>
          </footer>
        </div>
      </dialog>
      <noscript>
        <nav className={styles.fallbackNavigation} aria-label={copy.navigation}>
          {copy.items.map((item) => (
            <a key={item.route} href={`/${locale}/${item.route}`}>
              {item.label}
            </a>
          ))}
          <a href={`/${locale === "en" ? "ar" : "en"}`}>{copy.fullLanguage}</a>
        </nav>
      </noscript>
    </div>
  );
}
