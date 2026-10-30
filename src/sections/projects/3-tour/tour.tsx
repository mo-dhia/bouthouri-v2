import 'server-only';
import Link from 'next/link';
import type { Locale } from '@/i18n/routing';
import TourGate from './tour-gate';
import { tourCopy, tourProject } from './tour.content';
import styles from './tour.module.css';

export default function Tour({ locale }: { locale: Locale }) {
  const copy = tourCopy[locale];
  return <section className={styles.root} data-tour-root data-locale={locale} data-tour-src={tourProject.viewer} data-tour-loading={copy.loading} data-tour-failed={copy.failed} data-tour-controls={JSON.stringify(copy.controls)} aria-labelledby='tour-heading'>
    <TourGate />
    <div className={styles.stage} data-tour-stage>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.poster} src={tourProject.poster} width='960' height='720' alt={copy.image} decoding='async' fetchPriority='high' />
      <div className={styles.viewer} data-tour-mount />
      <div className={styles.heading}><h1 id='tour-heading'>{copy.title}</h1><span>{copy.category}</span></div>
      <details className={styles.notes}>
        <summary>{copy.notes}</summary>
        <div className={styles.panel}><h2>{copy.about}</h2><p>{copy.description}</p><a href={tourProject.source} target='_blank' rel='external noopener'>{copy.source} ↗</a></div>
      </details>
      <button className={styles.close} type='button' data-tour-close hidden>{copy.stop} ×</button>
      <button className={styles.launch} type='button' data-tour-launch disabled>
        <svg viewBox='0 0 100 64' fill='none' aria-hidden='true'><path d='M12 30c-7 3-10 7-10 11 0 10 21 18 48 18s48-8 48-18c0-4-3-8-10-11M74 15l13 14 10-17M26 15 13 29 3 12' stroke='currentColor' strokeWidth='2' /><text x='50' y='34' textAnchor='middle' fill='currentColor' fontSize='25'>360°</text></svg>
        <span data-tour-enter>{copy.enter}</span><span data-tour-retry hidden>{copy.retry}</span>
      </button>
      <p className={styles.status} data-tour-status role='status' aria-live='polite' />
      <div className={styles.bottom}><Link href={`/${locale}/projects`}>↗ {copy.back}</Link><a href={tourProject.source} target='_blank' rel='external noopener'>Artefact Studio ↗</a></div>
      <noscript><p className={styles.noScript}>{copy.noScript}</p></noscript>
    </div>
    <p className={styles.instructions} id='tour-instructions'>{tourProject.instructions[locale]}</p>
  </section>;
}
