import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routing";
import Header from "@/components/layout/header/header";
import Footer from "@/components/layout/footer/footer";
import Hero from "./1-hero/hero";
import Perspective from "./2-perspective/perspective";

export default function Landing({ locale, dictionary: copy }: { locale: Locale; dictionary: Dictionary }) {
  return (
    <>
      <a className="skip-link" href="#content">{copy.navigation.skip}</a>
      <Header locale={locale} dictionary={copy} />
      <main id="content" data-page="landing">
        <Hero copy={copy.hero} />
        <Perspective copy={copy.vision} />
      </main>
      <Footer copy={copy.footer} />
    </>
  );
}
