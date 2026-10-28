"use client";

import type { Locale } from "@/i18n/routing";
import { useContactEnhancements } from "./contact-gate.logic";

export default function ContactGate({ locale }: { locale: Locale }) {
  useContactEnhancements(locale);
  return null;
}
