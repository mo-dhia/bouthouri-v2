import "server-only";

import type { Locale } from "@/i18n/routing";
import { ServicesHero } from "./1-hero/hero";
import { ServicesOpening } from "./2-opening/opening";
import { ServicesIndex } from "./3-index/service-index";
import { ServicesClosing } from "./4-closing/closing";
import { ServicesGate } from "./services-gate";
import styles from "./services.module.css";

export default function ServicesContent({ locale }: { locale: Locale }) {
  return (
    <div id="services-content" className={styles.page} data-services-page data-locale={locale}>
      <ServicesHero locale={locale} />
      <ServicesOpening locale={locale} />
      <ServicesIndex locale={locale} />
      <ServicesClosing locale={locale} />
      <ServicesGate />
    </div>
  );
}
