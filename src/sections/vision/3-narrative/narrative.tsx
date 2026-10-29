import 'server-only';

import { Fragment } from 'react';
import type { Locale } from '@/i18n/routing';
import type { VisionCopy } from '../content';
import { Action, Masked } from '../components/vision-markup';
import { voiceContours } from './narrative-math';

export default function Narrative({ locale, content }: { locale: Locale; content: VisionCopy }) {
  const rtl = locale === 'ar';
  return <>
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
  </>;
}
