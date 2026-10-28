import "server-only";

import type { Locale } from "@/i18n/routing";
import ContactPage from "./1-conversation/contact-page";

export default function ContactContent({ locale }: { locale: Locale }) {
  return <ContactPage locale={locale} />;
}
