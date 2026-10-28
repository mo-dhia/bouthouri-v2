import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/routing";
import Editorial from "@/components/layout/editorial/editorial";
import ContactContent from "@/sections/contact/contact";
import { editorialMetadata } from "@/lib/editorial-metadata";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return editorialMetadata("contact", locale);
}
export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Editorial locale={locale} page="contact"><ContactContent locale={locale} /></Editorial>;
}
