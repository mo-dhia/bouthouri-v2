import "server-only";
import type { Locale } from "@/i18n/routing";
import { servicesContent } from "../content";
import { ServiceMask, serviceClass as c } from "../service-type";

export function ServicesHero({ locale }: { locale: Locale }) {
  const text = servicesContent[locale];
  return (
    <header className={c("practice-opening")} data-route-hero data-editorial-composition data-hero-concept="clarity">
      <div className={c("practice-hero-geometry")} aria-hidden="true"><canvas className={c("practice-depth")} /></div>
      <div className={c("editorial-kicker")} data-editorial-layer="meta"><ServiceMask id="hero-index">{text.index}</ServiceMask></div>
      <div className={c("practice-hero-type")}>
        <h1 data-editorial-layer="heading">{text.hero.map((line, index) => <span key={line} className={c("editorial-line")}><ServiceMask id={`hero-title-${index}`} rendered>{line}</ServiceMask></span>)}</h1>
        <div className={c("practice-opening-foot")}>
          <p data-editorial-layer="copy"><ServiceMask id="hero-copy" rendered>{text.intro}</ServiceMask></p>
          <ServiceMask id="hero-action"><a className={c("editorial-text-link")} href="#services-journey" data-services-advance data-material-sound="hover">{text.read}<i aria-hidden="true" /></a></ServiceMask>
        </div>
      </div>
    </header>
  );
}
