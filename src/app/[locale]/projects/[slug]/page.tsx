import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/routing';
import Editorial from '@/components/layout/editorial/editorial';
import Experiment, { experimentSlugs, findExperiment } from '@/sections/projects/2-experiment/experiment';
import { editorialMetadata } from '@/lib/editorial-metadata';
import { brand } from '@/config/brand';

type Props = { params: Promise<{ locale: string; slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return experimentSlugs.map(slug => ({ slug })); }
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const item = findExperiment(slug);
  if (!isLocale(locale) || !item) notFound();
  const inherited = editorialMetadata('projects', locale), path = `/projects/${slug}`;
  return { ...inherited, title: `${item.name} — ${locale === 'ar' ? 'دراسة تفاعلية' : 'Interaction study'} — ${locale === 'ar' ? brand.arabicName : brand.name}`,
    description: item.instructions[locale], twitter: { card: 'summary', title: item.name, description: item.instructions[locale] }, alternates: { canonical: `/${locale}${path}`, languages: { en: `/en${path}`, ar: `/ar${path}`, 'x-default': `/en${path}` } },
    openGraph: { ...inherited.openGraph, title: item.name, description: item.instructions[locale], url: `/${locale}${path}` } };
}
export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !findExperiment(slug)) notFound();
  return <Editorial locale={locale} page='projects' route={`/projects/${slug}`} footer={false}><Experiment locale={locale} slug={slug} /></Editorial>;
}
