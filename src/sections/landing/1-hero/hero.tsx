import "server-only";

import Image from "next/image";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routing";
import { getShellCopy } from "@/components/layout/header/shell-copy";
import {
  loaderPieceBox,
  loaderRow,
  loaderViewBox,
  markPaths,
  markPieces,
  markTransform,
} from "@/components/layout/header/identity-mark";
import KineticLink from "@/components/layout/header/kinetic-link";
import HeroAnimateGate from "./hero-animate-gate";
import styles from "./hero.module.css";
import entry from "./hero-entry.module.css";

const signature = [
  [
    "M29 270 C26 269 29 267 33 265 C71 250 157 239 223 242 C313 241 354 246 449 274",
    6.3,
  ],
  [
    "M144 335 C149 322 162 305 172 287 C190 255 206 223 218 182 C227 151 231 121 231 96",
    6.5,
  ],
  ["M231 96 C233 151 213 234 195 311", 8.5],
  ["M195 311 C224 235 259 148 294 65 C298 55 300 58 299 70", 10],
  ["M299 70 C299 146 297 226 296 304 C296 324 295 343 299 346", 9],
  [
    "M29 271 C52 270 83 268 113 268 C169 267 222 266 276 281 C297 286 320 294 322 310 C323 321 307 339 299 346",
    9.5,
  ],
] as const;

export default function Hero({
  copy,
  locale,
}: {
  copy: Dictionary["hero"];
  locale: Locale;
}) {
  const labels = getShellCopy(locale);
  return (
    <section
      className={styles.hero}
      id="identity"
      aria-labelledby="hero-name"
      data-route-hero="true"
      data-hero-phase="static"
      data-locale={locale}
    >
      <HeroAnimateGate />
      <div className={styles.scene} data-identity-hero="true">
        <div
          className={entry.loading}
          data-identity-loading="true"
          data-entry-stage="loading"
          hidden
        >
          <div
            className={entry.stage}
            data-identity-stage="true"
            aria-hidden="true"
          >
            <svg viewBox={loaderViewBox} fill="currentColor">
              <defs>
                {markPieces.map((name) => (
                  <clipPath key={name} id={`identity-piece-${name}`}>
                    <rect
                      data-identity-clip={name}
                      x={-loaderPieceBox[name].w / 2 - 4}
                      y="0"
                      width={loaderPieceBox[name].w + 8}
                      height="0"
                    />
                  </clipPath>
                ))}
              </defs>
              {markPieces.map((name, i) => (
                <g
                  key={name}
                  data-identity-piece={name}
                  transform={markTransform(loaderRow[name])}
                >
                  <path
                    d={markPaths[i]}
                    opacity=".055"
                    data-identity-latent="true"
                  />
                  <g
                    data-identity-material={name}
                    clipPath={`url(#identity-piece-${name})`}
                  >
                    <path d={markPaths[i]} />
                  </g>
                </g>
              ))}
            </svg>
          </div>
          <div
            className={entry.srOnly}
            role="progressbar"
            data-identity-progress="true"
            aria-label={labels.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
          />
          <div
            className={entry.choices}
            data-identity-choices="true"
            role="group"
            aria-label={labels.entryLabel}
            inert
          >
            <span className={entry.choiceMask}>
              <button
                type="button"
                data-entry-choice="quiet"
                data-identity-choice="quiet"
                aria-label={labels.enterQuiet}
              >
                {labels.quiet}
              </button>
            </span>
            <span className={entry.choiceMask}>
              <button
                type="button"
                data-entry-choice="sound"
                data-identity-choice="sound"
                aria-label={labels.enterSound}
              >
                {labels.sound}
              </button>
            </span>
          </div>
          <span
            className={entry.srOnly}
            role="status"
            data-identity-status="true"
            data-ready-label={labels.ready}
          >
            {labels.initializing}
          </span>
          <button
            type="button"
            className={entry.continue}
            data-identity-continue="true"
            hidden
          >
            {labels.continue}
          </button>
        </div>
        <div className={styles.world} data-hero-world="true">
          <div
            className={styles.marquee}
            aria-hidden="true"
            data-hero-marquee="true"
          >
            <div
              className={styles.track}
              data-hero-marquee-track="true"
              dir="ltr"
            >
              {[0, 1].map((i) => (
                <div key={i} className={styles.cycle} data-hero-cycle="true">
                  <span dir={locale === "ar" ? "rtl" : "ltr"}>
                    {copy.marquee}
                    <i>×</i>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.portrait} data-hero-portrait="true">
            <div
              className={styles.portraitEntrance}
              data-portrait-entrance="true"
            >
              <Image
                src="/assets/images/hero-portrait-rebrand.webp"
                alt={copy.portraitAlt}
                width={1536}
                height={1024}
                sizes="(max-width: 600px) 230.9708737864vw, (max-width: 1024px) 173.3333333333vw, 100vw"
                preload
                unoptimized
                draggable={false}
              />
              <canvas
                className={styles.portraitCanvas}
                data-portrait-canvas="true"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
        <div
          className={styles.information}
          data-hero-identity="true"
          id="contact"
          tabIndex={-1}
        >
          <svg
            className={styles.signature}
            viewBox="-20 28 528 342"
            fill="none"
            aria-hidden="true"
          >
            {signature.map(([d, width]) => (
              <path
                key={d}
                d={d}
                strokeWidth={width}
                pathLength={1}
                data-signature-stroke="true"
              />
            ))}
          </svg>
          <div data-hero-copy-exit="true">
            <div className={styles.copyEntrance} data-hero-copy-entrance="true">
              <div className={styles.copyWindow}>
                <h1
                  id="hero-name"
                  aria-label={copy.title}
                  data-hero-name-line="true"
                >
                  <span data-route-line="true">{copy.title}</span>
                </h1>
              </div>
              <p className={styles.support} data-hero-support="true">
                <span className={styles.copySource} data-copy-source="true">
                  {copy.description}
                </span>
                <span
                  className={styles.copyLines}
                  data-copy-lines="true"
                  aria-hidden="true"
                />
              </p>
            </div>
          </div>
        </div>
        <div className={styles.bottom} data-hero-bottom="true">
          <div className={styles.cueWindow}>
            <div className={styles.cueEntrance} data-hero-cue-entrance="true">
              <button
                className={styles.pause}
                type="button"
                data-marquee-pause="true"
                aria-label={labels.pause}
                aria-pressed="false"
                data-pause-label={labels.pause}
                data-resume-label={labels.resume}
              >
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 4v8M10 4v8" />
                </svg>
              </button>
              <KineticLink href="#top" className={styles.scrollLink}>
                {copy.explore}
              </KineticLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
