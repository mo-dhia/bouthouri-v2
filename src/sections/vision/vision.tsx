import 'server-only';

import { Fragment, type ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';
import { viewportDesigns } from '@/lib/viewport-design';
import { practiceHeroLayout } from './1-opening/practice-hero';
import copy from './content.json';
import wordOutlines from './2-perspective/word-outlines.json';
import { systemStructures } from './2-perspective/system-geometry';
import { voiceContours } from './3-narrative/narrative-math';
import VisionGate from './vision-gate';
import styles from './vision.module.css';

function Lines({ lines }: { lines: string[] }) {
  return lines.map((line, index) => <span className='editorial-line' key={index}><span>{line}</span></span>);
}

function Masked({ id, lines, children, renderedLines = false }: { id?: string; lines?: string[]; children?: ReactNode; renderedLines?: boolean }) {
  return <span className='masked-text' data-masked-reveal={id ?? ''} data-rendered-lines={renderedLines || undefined}>
    {renderedLines ? <span data-reveal-source>{children}</span> : lines ? lines.map((line, index) => <span className='editorial-line masked-text-line' key={index}><span data-reveal-piece>{line}</span></span>) : <span className='editorial-line masked-text-line'><span data-reveal-piece>{children}</span></span>}
  </span>;
}

function Action({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className='editorial-action' data-material-sound><span className='editorial-action-window'><span>{children}</span><span aria-hidden>{children}</span></span><i aria-hidden /></a>;
}

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

export default function VisionContent({ locale }: { locale: Locale }) {
  const content = copy[locale], rtl = locale === 'ar';
  const narrativeWords = rtl ? ['الصورة الكبيرة.', 'التفاصيل'] : ['SYSTEM.', 'DETAILS.'];
  return <div className={styles.vision} data-vision-root dir={rtl ? 'rtl' : 'ltr'}>
    <header className='practice-opening' data-editorial-composition data-hero-concept='perspective' data-route-hero>
      <div aria-hidden className='practice-hero-geometry'>
        {Object.values(viewportDesigns).map(design => {
          const layout = practiceHeroLayout('about', design.width, design.height);
          return <svg key={design.key} className={`practice-hero-poster poster-${design.key}`} viewBox={`0 0 ${design.width} ${design.height}`} fill='none' preserveAspectRatio='none'><defs><linearGradient id={`vision-logo-fallback-${design.key}`} x1='0' y1='0' x2='1' y2='1'><stop stopColor='#9a978e' /><stop offset='.45' stopColor='#262622' /><stop offset='.75' stopColor='#76746d' /><stop offset='1' stopColor='#1b1b18' /></linearGradient></defs><path transform={`translate(${layout.x} ${layout.y}) scale(${layout.size / 73.600516})`} d='M 0.16283161449966 36.76676079027144 A 36.62617153347209 36.76712414115423 0 1 1 0.16283161449966 -36.76676079027144 L 0.16283161449966 -22.502439339404283 A 22.379709467186295 22.503034981546598 0 1 0 0.16283161449966 22.502439339404283 Z' fill={`url(#vision-logo-fallback-${design.key})`} /></svg>;
        })}
        <canvas className='practice-depth' aria-hidden />
      </div>
      <div className='editorial-kicker' data-editorial-layer='meta'><Masked id='hero-index'>{content.index}</Masked><Masked id='hero-identity'><bdi>{content.name}</bdi></Masked></div>
      <div className='practice-hero-type'>
        <h1 data-editorial-layer='heading'>{content.hero.map((line, index) => <span className='editorial-line' key={index}><Masked id={`hero-title-${index}`} renderedLines>{line}</Masked></span>)}</h1>
        <div className='practice-opening-foot'>
          <p data-editorial-layer='copy'>{content.intro.includes('\n') ? <Masked id='hero-copy' lines={content.intro.split('\n')} /> : <Masked id='hero-copy' renderedLines>{content.intro}</Masked>}</p>
          <Masked id='hero-action'><a href='#vision-content' className='editorial-text-link' data-vision-advance>{content.read}<i aria-hidden /></a></Masked>
        </div>
      </div>
    </header>
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
    <section className='about-other-side' data-about-other data-editorial-composition aria-labelledby='about-underneath'>
      <span className='editorial-eyebrow' data-editorial-layer='meta'><Masked id='other-label'>{content.underneath.label}</Masked></span>
      <h2 id='about-underneath' data-editorial-layer='heading'><Masked id='other-title' lines={content.underneath.title} /></h2>
      <div className='about-underneath-copy' data-editorial-layer='copy'><p className='about-aside'><Masked id='other-statement'>{content.underneath.aside}</Masked></p><p className='practice-copy'><Masked id='other-copy' renderedLines>{content.underneath.copy}</Masked></p></div>
    </section>
    <section className='about-thought-motion' data-about-thoughts aria-label={content.communication.label}><div className='about-thought-stage'>{content.communication.thoughts.map((thought, index) => <div key={thought.id} className={`about-moving-thought thought-state-${index}`} data-moving-thought={index}><h2><Masked id={`thought-${index}`} lines={thought.title} /></h2></div>)}</div></section>
    <section className='about-leadership' data-about-leadership aria-labelledby='about-leading'><div className='about-leadership-stage'><div className='about-leadership-safe'>
      <div className='about-voices'>{content.leadership.questions.map((question, index) => <div key={question} className={`about-voice about-voice-${index}`} data-about-voice={index}>
        <svg aria-hidden className='about-voice-form' viewBox='0 0 94 112' fill='none'><g transform={(rtl ? index % 2 === 0 : index % 2 === 1) ? 'translate(94 0) scale(-1 1)' : undefined}><path d={voiceContours[index]} pathLength='1' vectorEffect='non-scaling-stroke' /></g></svg>
        <p className='about-voice-sentence'>{question.split(/\s+/u).map((word, i) => <Fragment key={i}>{i > 0 ? ' ' : ''}<span data-voice-word>{word}</span></Fragment>)}</p>
      </div>)}</div>
      <div className='about-leadership-core'><h2 id='about-leading'><Masked id='lead-title' lines={content.leadership.title} /></h2><p className='practice-copy'><Masked id='lead-copy' renderedLines>{content.leadership.copy}</Masked></p></div>
    </div></div></section>
    <section className='practice-end about-invitation-end' data-about-invitation data-editorial-composition>
      <h2 data-editorial-layer='heading'><Masked id='end-title' lines={content.end.title} /></h2><p className='practice-copy' data-editorial-layer='copy'><Masked id='end-copy' renderedLines>{content.end.copy}</Masked></p>
      <div className='practice-end-actions'><div className='about-cta-explore'><Masked id='end-services'><Action href={`/${locale}/services`}>{content.end.action}</Action></Masked></div><div className='about-cta-contact'><Masked id='end-contact'><Action href={`/${locale}/contact`}>{content.end.contact}</Action></Masked></div></div>
    </section>
    <VisionGate />
  </div>;
}
