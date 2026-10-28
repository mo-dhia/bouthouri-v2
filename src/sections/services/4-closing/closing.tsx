import "server-only";
import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import { servicesContent } from "../content";
import { ServiceLines, serviceClass as c } from "../service-type";

export function ServicesClosing({ locale }: { locale: Locale }) {
  const text = servicesContent[locale].end;
  return (
    <section className={`${c("practice-end")} ${c("page-closing-cta")}`} data-editorial-composition>
      <span className={c("editorial-eyebrow")} data-editorial-layer="meta">{text.label}</span>
      <h2 data-editorial-layer="heading"><ServiceLines lines={text.title} /></h2>
      <p className={c("practice-copy")} data-editorial-layer="copy">{text.copy}</p>
      <div className={c("practice-end-actions")}><Link prefetch={false} href={`/${locale}/contact`} className={c("editorial-action")} data-material-sound><span className={c("editorial-action-window")}><span>{text.action}</span><span aria-hidden="true">{text.action}</span></span><i aria-hidden="true" /></Link></div>
    </section>
  );
}
