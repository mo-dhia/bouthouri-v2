import "server-only";
import type { Locale } from "@/i18n/routing";
import { servicesContent } from "../content";
import { ServiceMask, serviceClass as c } from "../service-type";

export function ServicesIndex({ locale }: { locale: Locale }) {
  const text = servicesContent[locale].capabilities;
  return (
    <section className={c("service-index")} id="in-plain-terms" data-service-index aria-labelledby="service-index-title">
      <header className={c("service-index-heading")} data-index-entry>
        <h2 id="service-index-title" data-index-title><ServiceMask rendered>{text.title}</ServiceMask></h2>
        <p data-index-copy><ServiceMask rendered>{text.hint}</ServiceMask></p>
      </header>
      <ol className={c("service-index-list")}>{text.items.map((item) => <li key={item.id} className={c("service-index-row")} data-index-entry data-service-id={item.id}>
        <span className={c("service-index-rule")} aria-hidden="true" />
        <div className={c("service-index-name")} data-index-title><h3><ServiceMask rendered>{item.name}</ServiceMask></h3></div>
        <p data-index-copy><ServiceMask rendered>{item.context}</ServiceMask></p>
      </li>)}</ol>
    </section>
  );
}
