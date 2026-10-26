import "server-only";
import type en from "./locales/en.json";
import type { Locale } from "./routing";

export type Dictionary = typeof en;
const dictionaries = {
  en: () => import("./locales/en.json").then((module) => module.default),
  ar: () => import("./locales/ar.json").then((module) => module.default),
};

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
