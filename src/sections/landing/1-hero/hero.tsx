import Image from "next/image";
import type { Dictionary } from "@/i18n/dictionaries";
import HeroAnimateGate from "./hero-animate-gate";
import styles from "./hero.module.css";

export default function Hero({ copy }: { copy: Dictionary["hero"] }) {
  return (
    <section className={styles.hero} id="top" aria-labelledby="hero-title">
      <HeroAnimateGate />
      <div className={styles.marquee} aria-hidden="true"><div data-hero-marquee>{[0, 1].map((i) => <span key={i} data-hero-cycle>{copy.marquee}<i>×</i></span>)}</div></div>
      <Image className={styles.portrait} src="/assets/images/hero-portrait.webp" alt={copy.portraitAlt} width={1536} height={1024} sizes="(max-width: 700px) 164vw, 100vw" preload unoptimized />
      <div className={styles.information}>
        <h1 id="hero-title" data-hero-title>{copy.title}</h1>
        <p>{copy.description}</p>
      </div>
      <div className={styles.bottom}>
        <a href="#perspective">{copy.explore}<span aria-hidden="true">↓</span></a>
      </div>
    </section>
  );
}
