import "server-only";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import { getDictionary } from "@/i18n/dictionaries";
import Header from "../header/header";
import Footer from "../footer/footer";
import EditorialNavigation, { type EditorialContext } from "./editorial-navigation";
import EditorialAnimateGate from "./editorial-animate-gate";
import styles from "./editorial.module.css";
export type EditorialPage = "vision" | "services" | "contact" | "projects";
const classes = { vision: "practice-page thinking-page", services: "practice-page solving-page", contact: "contact-page", projects: "projects-page" };
export default async function Editorial({ locale, page, children, footer = true, route = `/${page}`, context }: { locale: Locale; page: EditorialPage; children: ReactNode; footer?: boolean; route?: string; context?: EditorialContext }) {
  const dictionary = await getDictionary(locale);
  return <div className={styles.root} data-editorial-page={page} key={`${locale}${route}`}>
    <EditorialAnimateGate page={page} />
    <Header locale={locale} variant="editorial" route={route} navigation={<EditorialNavigation locale={locale} route={route} context={context} />} />
    <main className={`editorial-page ${classes[page]}`} data-page={page} data-route-path={`/${locale}${route}`} dir={locale === "ar" ? "rtl" : "ltr"}>{children}</main>
    {footer && <Footer locale={locale} copy={dictionary.footer} variant="standard" />}
  </div>;
}
