import { notFound } from "next/navigation";
import Landing from "@/sections/landing/landing";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/routing";

export default async function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Landing locale={locale} dictionary={await getDictionary(locale)} />;
}
