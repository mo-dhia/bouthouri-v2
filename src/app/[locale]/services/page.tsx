import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/routing";
import Editorial from "@/components/layout/editorial/editorial";
import ServicesContent from "@/sections/services/services";
import { editorialMetadata } from "@/lib/editorial-metadata";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return editorialMetadata("services", locale);
}
export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Editorial locale={locale} page="services"><ServicesContent locale={locale} /></Editorial>;
}
