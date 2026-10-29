import 'server-only';

import type { Locale } from '@/i18n/routing';
import type { VisionCopy } from '../content';
import { Lines, Masked } from '../components/vision-markup';
import wordOutlines from './word-outlines.json';
import { systemStructures } from './system-geometry';

function SystemField({ locale }: { locale: Locale }) {
  const words = wordOutlines[locale].words, prefix = `vision-${locale}`;
  return <svg className='system-details-field' data-system-details aria-hidden focusable='false' fill='none'>
    <defs>
      {words.flatMap((_, index) => ['thread', 'bridge'].map(kind => <g key={`${kind}-${index}`}>
        <linearGradient id={`${prefix}-${kind}-fade-${index}`} data-thread-mask-gradient={kind === 'thread' ? index : undefined} data-bridge-mask-gradient={kind === 'bridge' ? index : undefined} gradientUnits='userSpaceOnUse' x1='0' x2='2'><stop offset='0' stopColor='white' stopOpacity='0' /><stop offset='1' stopColor='white' /></linearGradient>
        <mask id={`${prefix}-${kind}-${index}`} data-directional-mask maskUnits='userSpaceOnUse' x='-200' y='-200' width='2000' height='5000' style={{ maskType: 'alpha' }}>
          <rect data-directional-mask x='-200' y='-200' width='2000' height='5000' fill={`url(#${prefix}-${kind}-fade-${index})`} />
          <rect data-thread-mask-above={index} x='-200' y='-200' width='2000' height='0' fill='white' />
          <rect data-thread-mask-below={index} x='-200' y='5000' width='2000' height='0' fill='white' />
        </mask>
      </g>))}
      {words.map((_, index) => <linearGradient key={index} id={`${prefix}-light-${index}`} data-material-light={index} gradientUnits='userSpaceOnUse' x1='0' x2='1200'><stop offset='0' stopColor='currentColor' stopOpacity='0' /><stop offset='.5' stopColor='#e0dccf' stopOpacity='.16' /><stop offset='1' stopColor='currentColor' stopOpacity='0' /></linearGradient>)}
    </defs>
    <g data-system-structure>{[systemStructures.desktop.primary, systemStructures.desktop.details].map((path, index) => <path key={index} d={path} data-system-walk={index} pathLength='1' className='system-details-stroke' opacity='.78' vectorEffect='non-scaling-stroke' />)}</g>
    {words.map((word, index) => <g key={index}>
      <g mask={`url(#${prefix}-thread-${index})`}><path className='system-details-stroke' data-system-thread={index} pathLength='1' vectorEffect='non-scaling-stroke' /></g>
      <g mask={`url(#${prefix}-bridge-${index})`}><path data-material-bridge={index} className='system-details-stroke system-details-edge' vectorEffect='non-scaling-stroke' /></g>
      <g data-system-type={index}><path data-material-surface={index} d={word.outline} fill='currentColor' /><path data-material-edge={index} d={word.outline} fill={`url(#${prefix}-light-${index})`} /></g>
    </g>)}
  </svg>;
}

export default function Perspective({ locale, content }: { locale: Locale; content: VisionCopy }) {
  const rtl = locale === 'ar';
  const narrativeWords = rtl ? ['الصورة الكبيرة.', 'التفاصيل'] : ['SYSTEM.', 'DETAILS.'];
  return (
    <section id='vision-content' aria-label={content.study.label} data-visual-chapter='perspective' className='practice-chapter chapter-perspective'>
      <div className='chapter-visual-rail' aria-hidden><div className='chapter-visual'><svg viewBox='0 0 600 450' fill='none' preserveAspectRatio='xMidYMid meet'><g>{[systemStructures.desktop.primary, systemStructures.desktop.details].map((path, index) => <path key={index} d={path} pathLength='1' opacity='.78' vectorEffect='non-scaling-stroke' />)}</g></svg></div></div>
      <div className='chapter-content'><div data-system-details-passage><div data-system-details-reading>
        {content.study.moments.map((thought, step) => <article key={thought.id} id={`thought-${thought.id}`} data-chapter-moment data-editorial-composition data-system-step={step} className={`practice-natural practice-thought thought-${thought.id}`}>
          <div className='practice-reading'>
            <span className='editorial-eyebrow' data-editorial-layer='meta'>{thought.label}</span>
            <h2 data-editorial-layer='heading'>{step < 2 ? thought.title.map((line, index) => {
              const word = narrativeWords[step], position = line.indexOf(word);
              return <span className='editorial-line' key={index}><span>{position < 0 ? line : <>{line.slice(0, position)}<span data-system-word>{word}</span>{line.slice(position + word.length)}</>}</span></span>;
            }) : <Lines lines={thought.title} />}</h2>
            <p className='practice-copy' data-editorial-layer='copy'><span data-system-description={step}><Masked renderedLines>{thought.copy}</Masked></span></p>
            <ul className='practice-metadata' data-editorial-layer='meta'>{thought.metadata.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        </article>)}
      </div></div></div><SystemField locale={locale} />
    </section>
  );
}
