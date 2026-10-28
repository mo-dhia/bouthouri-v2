import "server-only";

import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routing";
import Header from "@/components/layout/header/header";
import Hero from "./1-hero/hero";
import Journey from "./3-journey/journey";

export default function Landing({ locale, dictionary: copy }: { locale: Locale; dictionary: Dictionary }) {
  return (
    <>
      <a className="skip-link" href="#beyond">{copy.navigation.skip}</a>
      <Header locale={locale} dictionary={copy} />
      <main id="content" data-page="landing" data-route-path={`/${locale}`}>
        <Hero copy={copy.hero} locale={locale} />
        <Journey locale={locale} dictionary={copy} />
      </main>
    </>
  );
}
