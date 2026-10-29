import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { locales } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/vision", "/services", "/contact", "/projects"].flatMap(route => locales.map(locale => ({
    url: new URL(`/${locale}${route}`, site.url).href,
    alternates: { languages: Object.fromEntries(locales.map(language => [language, new URL(`/${language}${route}`, site.url).href])) },
  })));
}
