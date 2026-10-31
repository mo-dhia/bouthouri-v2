import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/routing';
import Editorial from '@/components/layout/editorial/editorial';
import Experiment, { experimentSlugs, findExperiment } from '@/sections/projects/2-experiment/experiment';
import { editorialMetadata } from '@/lib/editorial-metadata';
import { brand } from '@/config/brand';
import Tour from '@/sections/projects/3-tour/tour';
import { tourProject, tourCopy } from '@/sections/projects/3-tour/tour.content';
import Case, { caseBack, caseSlugs, findCase } from '@/sections/projects/4-case/case';
import { caseUi } from '@/sections/projects/4-case/case.content';
import { projectCopy } from '@/sections/landing/3-journey/work-paths.js';

type Props = { params: Promise<{ locale: string; slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return [...caseSlugs, ...experimentSlugs, tourProject.slug].map(slug => ({ slug })); }
/** Work categories are set in capitals on the page; titles read them in sentence case. */
const sentence = (category: string) => category.toLowerCase().replace(/^./u, letter => letter.toUpperCase()).replace(/\bai\b/u, 'AI');
const signature = (locale: Locale) => locale === 'ar' ? brand.arabicName : brand.name;

function describe(locale: Locale, slug: string) {
  const project = findCase(slug);
  if (project) { const copy = projectCopy(project, locale); return { name: copy.name, category: sentence(copy.category), description: project.seo[locale].description }; }
  if (slug === tourProject.slug) return { name: tourCopy[locale].title, category: tourCopy[locale].category, description: tourProject.instructions[locale] };
  const experiment = findExperiment(slug);
  return experiment && { name: experiment.name, category: locale === 'ar' ? 'دراسة تفاعلية' : 'Interaction study', description: experiment.instructions[locale] };
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const item = isLocale(locale) ? describe(locale, slug) : undefined;
  if (!isLocale(locale) || !item) notFound();
  const inherited = editorialMetadata('projects', locale), path = `/projects/${slug}`;
  return { ...inherited, title: `${item.name} — ${item.category} — ${signature(locale)}`,
    description: item.description, twitter: { card: 'summary', title: item.name, description: item.description }, alternates: { canonical: `/${locale}${path}`, languages: { en: `/en${path}`, ar: `/ar${path}`, 'x-default': `/en${path}` } },
    openGraph: { ...inherited.openGraph, title: item.name, description: item.description, url: `/${locale}${path}` } };
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !describe(locale, slug)) notFound();
  const project = findCase(slug), route = `/projects/${slug}`;
  if (project) {
    const ui = caseUi[locale], context = { label: `${ui.projects} / ${project.number}`, detail: projectCopy(project, locale).category, back: { href: caseBack(locale, slug), label: ui.back } };
    return <Editorial locale={locale} page='projects' route={route} context={context}><Case locale={locale} project={project} /></Editorial>;
  }
  return <Editorial locale={locale} page='projects' route={route} footer={false}>{slug === tourProject.slug ? <Tour locale={locale} /> : <Experiment locale={locale} slug={slug} />}</Editorial>;
}
