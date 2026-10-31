import 'server-only';

import Link from 'next/link';
import type { Locale } from '@/i18n/routing';
import { Masked } from '@/sections/vision/components/vision-markup';
import { WORK_PROJECTS, projectCopy, projectHref } from '@/sections/landing/3-journey/work-paths.js';
import { CASE_CONCEPTS, TOUR_STUDY, TRIP_STUDY, TWIST_STUDY, coneTransform, financePath, type CaseId } from './case-geometry';
import { caseStory, caseUi, type CaseFigure, type CaseStory } from './case.content';
import CaseGate from './case-gate';
import styles from './case.module.css';

type Project = (typeof WORK_PROJECTS)[number];
type Ui = (typeof caseUi)[Locale];
const direction = (locale: Locale) => locale === 'ar' ? 'rtl' : 'ltr';
export const caseSlugs = WORK_PROJECTS.map(project => project.slug);
export const findCase = (slug: string) => WORK_PROJECTS.find(project => project.slug === slug);
/** Case pages return to their own moment in the home's work chapter. */
export const caseBack = (locale: Locale, slug: string) => `/${locale}?work=${slug}`;

function Copy({ paragraphs }: { paragraphs: string[] }) {
  return paragraphs.map(paragraph => <p data-story-reveal='copy' dir='auto' key={paragraph}><Masked renderedLines>{paragraph}</Masked></p>);
}

function Heading({ lines, id }: { lines: string[]; id?: string }) {
  return <h2 id={id}>{lines.map(line => <span className='case-statement-line' data-story-reveal='title' key={line}><Masked renderedLines>{line}</Masked></span>)}</h2>;
}

function Hero({ project, locale, ui }: { project: Project; locale: Locale; ui: Ui }) {
  const copy = projectCopy(project, locale), story = caseStory(project.id as CaseId, locale), dir = direction(locale);
  return <header data-route-hero className={`case-hero project-case-hero case-identity-${project.id}`} lang={locale} dir={dir}>
    <div className='case-route-label'><Masked id='hero-index'>
      <span className='case-indicator' data-project-indicator lang={locale} dir={dir}>
        <Link href={caseBack(locale, project.slug)} prefetch={false} dir={dir}>{ui.projects}</Link>
        <span dir='ltr' aria-hidden='true'>/</span>
        <bdi dir='ltr' className='case-indicator-number'>{project.number}</bdi>
      </span>
    </Masked></div>
    <div className='case-mark-position'><div className='case-mark-depth'>
      <svg className='case-identity-mark' data-project-mark={project.slug} viewBox='0 0 320 210' aria-hidden='true' fill='none'>
        <path className='case-mark-lead' d='M80 -160 C80 -40 -80 130 0 130' />
        <path data-case-mark-path pathLength={1} d={project.mark.path} />
        <path className='case-mark-tail' pathLength={1} d='M320 130 C370 130 300 235 300 320' />
      </svg>
    </div></div>
    <h1 className='case-hero-title' lang='en' dir='ltr' aria-label={copy.name}>{(copy.lines as string[]).map((line, index) => <span key={line}><Masked id={`hero-title-${index}`}>{line}</Masked></span>)}</h1>
    <div className='case-hero-deck'>
      <p lang={locale} dir={dir}><Masked id='hero-copy' renderedLines>{story.deck}</Masked></p>
      <span><Masked id='hero-identity'>{project.context.role[locale]}</Masked></span>
    </div>
    <div className='case-reading-position'><Masked id='hero-action'><a className='case-reading-link' href='#case-story'>{ui.read}<i aria-hidden='true' /></a></Masked></div>
  </header>;
}

function Context({ project, locale, ui }: { project: Project; locale: Locale; ui: Ui }) {
  const { company, location, period, websites, role } = project.context, several = websites.length > 1;
  return <section className='case-project-context' lang={locale} dir={direction(locale)} aria-label={ui.context}>
    <header><p>{ui.context}</p></header>
    <div className='case-context-body'><dl>
      <div><dt>{ui.company}</dt><dd><bdi dir='auto'>{company[locale]}</bdi></dd></div>
      <div><dt>{ui.location}</dt><dd>{location[locale]}</dd></div>
      {period?.start && <div><dt>{ui.period}</dt><dd className='case-context-period'><bdi dir='ltr'>{period.start}</bdi><span aria-hidden='true'> — </span><bdi dir='auto'>{period.end ?? ui.present}</bdi></dd></div>}
      <div className='case-context-role'><dt>{ui.role}</dt><dd>{role[locale]}</dd></div>
      <div className='case-context-websites'><dt>{several ? ui.websites : ui.website}</dt><dd>{websites.map(site =>
        <a key={site.url} className='case-external-link' href={site.url} target='_blank' rel='noopener noreferrer' aria-label={`${site.name} | ${site.domain} (${ui.external})`}>
          <span>{several && <bdi className='case-external-name' dir='ltr'>{site.name}</bdi>}<bdi dir='ltr'>{site.domain}</bdi></span>
          <svg viewBox='0 0 24 24' width='24' height='24' aria-hidden='true' fill='none'><path d='M5 19 19 5M5 5h14v14' /></svg>
        </a>)}</dd></div>
    </dl></div>
  </section>;
}

function Statement({ story, locale, ui, closing = false }: { story: CaseStory; locale: Locale; ui: Ui; closing?: boolean }) {
  return <section className={`case-editorial-statement ${closing ? 'case-conclusion' : 'case-opening-thought'}`} id={closing ? undefined : 'case-story'}>
    <p className='case-story-label' lang={locale} dir={direction(locale)}>{closing ? '04' : '01'} / {closing ? ui.through : ui.starting}</p>
    <div data-story-depth={closing ? '18' : '-18'}><Heading lines={closing ? story.reflection : story.thesis} /></div>
    <div className='case-statement-copy'><Copy paragraphs={closing ? story.closing : story.context} /></div>
  </section>;
}

const routeEnd = (route: string) => route.trim().split(/[\s,A-Za-z]+/).filter(Boolean).slice(-2).join(' ');

function Concept({ id, story }: { id: CaseId; story: CaseStory }) {
  const concept = CASE_CONCEPTS[id];
  if (concept.variant === 'layer') return <div className='case-concept case-layer-concept'>
    <div className='case-finance-direction' aria-hidden='true'>{story.labels.map((label, index) => <span data-finance-label={index} key={label}>{label}</span>)}</div>
    <svg data-story-svg viewBox='0 0 480 340' fill='none' aria-hidden='true'>
      <path className='concept-rest' d={concept.rest} />
      <path className='concept-ticks' d={concept.ticks} />
      <path className='concept-market' d={concept.market} />
      <path data-concept-finance d={financePath(0)} />
    </svg>
  </div>;
  const cursor = `translate(${routeEnd(concept.route!)})${concept.turn ? ` rotate(${concept.turn})` : ''}`;
  return <div className={`case-concept case-route-concept case-${concept.variant}-concept`}>
    <span className='case-concept-word'>{story.word}</span>
    <svg data-story-svg viewBox='0 0 480 340' fill='none' aria-hidden='true'>
      <path className='concept-rest' d={concept.rest} />
      {concept.parts?.map(part => <path key={part.name} data-concept-part={part.name} d={part.d} transform={coneTransform(1)} />)}
      <path className='concept-ticks' d={concept.ticks} />
      <path data-concept-route pathLength={1} d={concept.route} />
      <path data-route-cursor data-cursor-turn={concept.turn} d={concept.cursor} transform={cursor} />
    </svg>
    <div className='case-route-labels' aria-hidden='true'>{story.labels.map(label => <span key={label}>{label}</span>)}</div>
  </div>;
}

function Progression({ project, story, locale, ui }: { project: Project; story: CaseStory; locale: Locale; ui: Ui }) {
  const dir = direction(locale), step = (index: number) => `case-step-${project.id}-${index}`;
  return <section className={`case-progression progression-${project.id}`} aria-labelledby='case-progression-title'>
    <header className='case-progression-heading'>
      <p className='case-story-label' lang={locale} dir={dir}>02 / {ui.inside}</p>
      <h2 id='case-progression-title' data-story-reveal='title'><Masked renderedLines>{story.fieldTitle}</Masked></h2>
    </header>
    <div className='case-progression-grid'>
      <aside className='case-concept-sticky'>
        <Concept id={project.id as CaseId} story={story} />
        <nav className='case-reading-index' dir={dir} aria-label={ui.concept}>{story.steps.map((item, index) =>
          <a key={item.label} href={`#${step(index)}`} data-reading-link><small>0{index + 1}</small><span>{item.label}</span></a>)}</nav>
        <p className='case-concept-note' dir='auto'>{story.note}</p>
      </aside>
      <div className='case-reading-sequence' dir={dir}>{story.steps.map((item, index) =>
        <article key={item.label} id={step(index)} data-reading-step>
          <span className='case-step-label'>0{index + 1} / {item.label}</span>
          <h3 data-story-reveal='title'><Masked renderedLines>{item.title}</Masked></h3>
          <Copy paragraphs={item.copy} />
        </article>)}</div>
    </div>
  </section>;
}

function Labels({ labels }: { labels: { meta: string; name: string }[] }) {
  return <div>{labels.map(label => <span data-story-reveal='title' key={label.name}><small>{label.meta}</small><Masked>{label.name}</Masked></span>)}</div>;
}

function Figure({ figure }: { figure: CaseFigure }) {
  const numbered = (labels: string[]) => labels.map((name, index) => ({ meta: `0${index + 1}`, name }));
  if (figure.kind === 'tour') return <figure className='case-tour-study' data-drawing-window>
    <svg data-story-svg viewBox='0 60 1080 124' fill='none' aria-hidden='true'><path className='concept-ticks' d={TOUR_STUDY.hotspots} /><path data-story-draw pathLength={1} d={TOUR_STUDY.walk} /></svg>
    <Labels labels={figure.spaces} />
    <figcaption>{figure.caption}</figcaption>
  </figure>;
  if (figure.kind === 'fold') return <figure className='case-fold-study' data-drawing-window>
    <svg data-story-svg viewBox='0 0 1080 260' fill='none' aria-hidden='true'><path className='concept-rest' d={TWIST_STUDY.rest} /><path data-story-draw pathLength={1} d={TWIST_STUDY.draw} /></svg>
    <Labels labels={numbered(figure.labels)} />
  </figure>;
  if (figure.kind === 'trip') return <figure className='case-trip-system' data-drawing-window>
    <div className='case-trip-sides'>{figure.sides.map(side => <span dir='auto' key={side}>{side}</span>)}</div>
    <svg data-story-svg viewBox='0 0 1080 210' fill='none' aria-hidden='true'><path data-story-draw pathLength={1} d={TRIP_STUDY.draw} /><path className='concept-rest' d={TRIP_STUDY.rest} /></svg>
    <div className='case-trip-services'>{figure.services.map(service => <span dir='auto' key={service}>{service}</span>)}</div>
    <figcaption>{figure.caption}</figcaption>
  </figure>;
  return <figure className='case-reference-study' data-drawing-window>
    <div className='case-reference-spine'>
      <span data-story-reveal='title'><Masked>{figure.spine}</Masked></span>
      <svg data-story-svg viewBox='0 0 1000 30' fill='none' preserveAspectRatio='none' aria-hidden='true'><path data-story-draw pathLength={1} d='M0 15H1000' /></svg>
    </div>
    <div className='case-reference-perspectives'>{numbered(figure.perspectives).map(label => <span data-story-reveal='title' key={label.name}><small>{label.meta}</small><Masked>{label.name}</Masked></span>)}</div>
  </figure>;
}

function CloseReading({ project, story, locale, ui }: { project: Project; story: CaseStory; locale: Locale; ui: Ui }) {
  return <section className={`case-close-reading detail-${project.id}`}>
    <div className='case-close-heading'>
      <p className='case-story-label' lang={locale} dir={direction(locale)}>03 / {ui.closer}</p>
      <Heading lines={story.detailTitle} />
      <div className='case-close-copy'>
        <Copy paragraphs={story.detailCopy} />
        {story.detailLink && <p data-story-reveal='copy' dir='auto'><Masked><Link href={`/${locale}${story.detailLink.route}`} prefetch={false}>{story.detailLink.label}</Link></Masked></p>}
      </div>
    </div>
    <Figure figure={story.figure} />
  </section>;
}

function Transition({ project, locale, ui }: { project: Project; locale: Locale; ui: Ui }) {
  const index = WORK_PROJECTS.findIndex(item => item.slug === project.slug), next = WORK_PROJECTS[index + 1], previous = index > 0 ? WORK_PROJECTS[index - 1] : undefined;
  const destination = (next ?? previous)!, label = next ? ui.next : ui.previous, copy = projectCopy(destination, locale);
  /** A long name keeps its identity's line break instead of running past the page. */
  const lines = copy.lines as string[], nameLines = lines.length > 1 ? lines.map(line => line.replace(/\.$/u, '')) : [copy.name];
  return <section className={`case-project-transition transition-${destination.id}`} aria-label={`${label}: ${copy.name}`} lang={locale} dir={direction(locale)}>
    <div className='case-project-nav'>
      <span>{label}</span>
      {next && previous && <Link prefetch={false} href={projectHref(locale, previous.slug)} data-case-slug={previous.slug}>{ui.previous}</Link>}
      <Link prefetch={false} href={caseBack(locale, project.slug)}>{ui.back}</Link>
    </div>
    <Link className='case-project-link case-entry' href={projectHref(locale, destination.slug)} data-case-slug={destination.slug} prefetch={false}>
      <span className='case-next-art' data-drawing-window>
        <svg className='project-resolved-mark case-next-mark' data-project-mark={destination.slug} data-story-svg viewBox='0 0 320 210' fill='none' aria-hidden='true'><path data-story-draw pathLength={1} d={destination.mark.path} /></svg>
      </span>
      <span className='case-project-name' lang='en' dir='ltr' data-story-reveal='title'><Masked lines={nameLines} /></span>
      <span className='case-project-caption'><span>{copy.descriptor}</span><span><bdi dir='ltr'>{destination.number} / {String(WORK_PROJECTS.length).padStart(2, '0')}</bdi><i aria-hidden='true' /></span></span>
    </Link>
  </section>;
}

/** One project's case study: server-rendered story, enhanced by a deferred controller. */
export default function Case({ locale, project }: { locale: Locale; project: Project }) {
  const ui = caseUi[locale], story = caseStory(project.id as CaseId, locale);
  return <div className={`case-page ${styles.case}`} data-case-root data-case-slug={project.slug} lang={locale} dir='ltr'>
    <Hero project={project} locale={locale} ui={ui} />
    <Context project={project} locale={locale} ui={ui} />
    <div className={`case-story-system story-${project.id}`} data-story-locale={locale} lang={locale}>
      <Statement story={story} locale={locale} ui={ui} />
      <Progression project={project} story={story} locale={locale} ui={ui} />
      <CloseReading project={project} story={story} locale={locale} ui={ui} />
      <Statement story={story} locale={locale} ui={ui} closing />
      <Transition project={project} locale={locale} ui={ui} />
    </div>
    <CaseGate />
  </div>;
}
