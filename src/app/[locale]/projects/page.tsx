import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/routing';
import Editorial from '@/components/layout/editorial/editorial';
import ProjectsGrid from '@/sections/projects/1-grid/grid';
import { editorialMetadata } from '@/lib/editorial-metadata';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return editorialMetadata('projects', locale);
}
export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Editorial locale={locale} page='projects' footer={false}><ProjectsGrid locale={locale} /></Editorial>;
}
