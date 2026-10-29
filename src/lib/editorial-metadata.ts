import "server-only";
import type { Metadata } from "next";
import { brand } from "@/config/brand";
import type { Locale } from "@/i18n/routing";
import type { EditorialPage } from "@/components/layout/editorial/editorial";
const titles = {
  projects: { en: "Projects", ar: "المشاريع" },
  vision: { en: "Vision", ar: "الرؤية" },
  services: { en: "Services", ar: "الخدمات" },
  contact: { en: "Contact", ar: "تواصل" },
};
const descriptions = {
  projects: { en: "Websites designed and built by Med D. Bouthouri, alongside interaction studies, in a draggable grid.", ar: "مواقع صمّمها وطوّرها محمد ضياء بوثوري، إلى جانب دراسات تفاعلية، في شبكة قابلة للسحب." },
  vision: { en: "A different point of view. How Med D. Bouthouri brings engineering, creative development and considered direction together.", ar: "وجهة نظر مختلفة. كيف يجمع محمد ضياء بوثوري بين الهندسة والتطوير الإبداعي والاتجاه الواضح." },
  services: { en: "From the first question to a working system. Engineering, creative development and leadership by Med D. Bouthouri.", ar: "من السؤال الأول إلى نظام يعمل. الهندسة والتطوير الإبداعي والقيادة مع محمد ضياء بوثوري." },
  contact: { en: "Start a conversation with Med D. Bouthouri about a project, a challenge, or an idea worth exploring.", ar: "ابدأ حوارًا مع محمد ضياء بوثوري حول مشروع أو تحدٍ أو فكرة تستحق الاستكشاف." },
};
export function editorialMetadata(page: EditorialPage, locale: Locale): Metadata {
  const title = `${titles[page][locale]} — ${locale === "ar" ? brand.arabicName : brand.name}`;
  const description = descriptions[page][locale];
  const path = `/${locale}/${page}`;
  return { title, description, alternates: { canonical: path, languages: { en: `/en/${page}`, ar: `/ar/${page}`, "x-default": `/en/${page}` } }, openGraph: { title, description, type: "website", url: path, siteName: brand.name, locale: locale === "ar" ? "ar_AR" : "en_US" }, twitter: { card: "summary", title, description } };
}
