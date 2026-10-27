import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Initializer from "@/components/initializer/initializer";
import SiteSchema from "@/components/seo/site-schema";
import { site } from "@/config/site";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localeDirection, locales } from "@/i18n/routing";
import "lenis/dist/lenis.css";
import "../globals.css";

export const dynamicParams = false;
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { metadata } = await getDictionary(locale);
  return {
    metadataBase: site.url,
    title: metadata.title,
    description: metadata.description,
    alternates: { canonical: `/${locale}`, languages: { en: "/en", ar: "/ar", "x-default": "/en" } },
    icons: { icon: "/icon.svg" },
    openGraph: { title: metadata.title, description: metadata.description, siteName: site.name, type: "website", url: `/${locale}`, locale: locale === "ar" ? "ar_AR" : "en_US" },
    twitter: { card: "summary", title: metadata.title, description: metadata.description },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} dir={localeDirection(locale)} data-typography="questrial-cairo">
      <head><link rel="preload" href={`/assets/fonts/${locale === "ar" ? "cairo-variable" : "questrial-regular"}.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" /></head>
      <body><SiteSchema locale={locale} /><Initializer />{children}</body>
    </html>
  );
}
