import "server-only";

import { site } from "@/config/site";
import { locales, type Locale } from "@/i18n/routing";

export default function SiteSchema({ locale }: { locale: Locale }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": new URL("/#website", site.url).href,
    url: new URL(`/${locale}`, site.url).href,
    name: site.name,
    inLanguage: [...locales],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
