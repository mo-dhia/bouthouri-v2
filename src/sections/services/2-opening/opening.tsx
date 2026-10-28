import "server-only";
import type { Locale } from "@/i18n/routing";
import { servicesContent } from "../content";
import { ServiceMask, serviceClass as c } from "../service-type";

export function ServicesOpening({ locale }: { locale: Locale }) {
  const text = servicesContent[locale].opening;
  const arabic = locale === "ar";
  return (
    <section id="services-journey" className={c("services-opening")} data-services-opening aria-label={text.label}>
      <div className={c("services-opening-stage")}>
        <div className={c("services-intro")} data-services-layer="intro">
          <span className={c("editorial-eyebrow")}><ServiceMask id="service-label">{text.label}</ServiceMask></span>
          <h2>
            <ServiceMask id="service-title"><span className={c("services-first-line")}>{arabic ? text.first : <>STAR<span data-rail-glyph>T</span> WITH</>}</span></ServiceMask>
            <ServiceMask id="service-second">{arabic ? <>عو<span data-rail-glyph>ا</span>ئق الطريق.</> : text.second}</ServiceMask>
          </h2>
          <p><ServiceMask id="service-copy" rendered>{text.copy}</ServiceMask></p>
        </div>
        <p className={c("services-band-reading")}>{text.band}</p>
        <svg className={c("services-glyph-flight")} data-services-layer="glyph" aria-hidden="true">
          <defs><clipPath id="services-band-clip"><path data-band-clip /></clipPath></defs>
          <path data-flying-glyph fill="#d5d1c5" />
          <g clipPath="url(#services-band-clip)"><text data-band-type textAnchor="middle" dominantBaseline="central" direction={arabic ? "rtl" : "ltr"}>{text.band}</text></g>
        </svg>
        <div className={c("services-gate-scene")} data-services-layer="gate">
          <div className={c("services-gate-underlay")}>
            <h2 className={c("services-it-works")}>{text.works}</h2>
            <div className={c("services-gate-payoff")}><h2><span className={c("masked-text")} data-masked-reveal="service-payoff">{text.payoff.map((line) => <span className={`${c("editorial-line")} ${c("masked-text-line")}`} key={line}><span data-reveal-piece>{line}</span></span>)}</span></h2></div>
          </div>
          <svg className={c("services-gate-surface")} aria-hidden="true">
            <defs><linearGradient id="gate-edge" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#9e9b90" stopOpacity="0" /><stop offset=".5" stopColor="#b5b0a1" /><stop offset="1" stopColor="#9e9b90" stopOpacity="0" /></linearGradient></defs>
            <path data-gate-top className={c("gate-cover")} fillRule="evenodd" />
            <path data-gate-top-edge className={c("gate-edge-depth")} />
            <path data-gate-seam className={c("gate-edge")} />
            <path data-gate-trajectory className={c("gate-trajectory")} />
            <path data-grip-contact className={c("gate-grip-contact")} />
            <path data-drawn-hand className={c("gate-drawn-hand")} pathLength="1" />
          </svg>
          <p className={c("services-grip-annotation")} aria-hidden="true">{text.instruction}</p>
          <button type="button" className={c("services-gate-handle")} aria-label={text.handle} aria-describedby="services-gate-help" hidden disabled />
          <span id="services-gate-help" className={c("sr-only")}>{text.keyboard}</span>
          <p className={c("sr-only")} role="status" aria-live="polite" data-gate-announcement data-message={text.status} />
        </div>
      </div>
    </section>
  );
}
