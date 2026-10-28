import "server-only";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import { getDictionary } from "@/i18n/dictionaries";
import Header from "../header/header";
import Footer from "../footer/footer";
import EditorialNavigation from "./editorial-navigation";
import EditorialAnimateGate from "./editorial-animate-gate";
import styles from "./editorial.module.css";
export type EditorialPage = "vision" | "services" | "contact";
const classes = { vision: "practice-page thinking-page", services: "practice-page solving-page", contact: "contact-page" };
export default async function Editorial({ locale, page, children }: { locale: Locale; page: EditorialPage; children: ReactNode }) {
  const dictionary = await getDictionary(locale);
  return <div className={styles.root} data-editorial-page={page} key={`${locale}/${page}`}>
    <EditorialAnimateGate page={page} />
    <Header locale={locale} variant="editorial" route={`/${page}`} navigation={<EditorialNavigation locale={locale} route={`/${page}`} />} />
    <main className={`editorial-page ${classes[page]}`} data-page={page} data-route-path={`/${locale}/${page}`} dir={locale === "ar" ? "rtl" : "ltr"}>{children}</main>
    <Footer locale={locale} copy={dictionary.footer} variant="standard" />
  </div>;
}
