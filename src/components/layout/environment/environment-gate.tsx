"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { environmentOwner } from "./environment.logic";

export default function EnvironmentGate({ locale }: { locale: string }) {
  const pathname = usePathname();
  useLayoutEffect(() => {
    const parking = document.querySelector<HTMLElement>(`[data-environment-parking="${locale}"]`);
    if (parking) return environmentOwner.mount(parking, locale, location.pathname);
  }, [locale]);
  useLayoutEffect(() => { environmentOwner.navigate(pathname); }, [pathname]);
  return null;
}
