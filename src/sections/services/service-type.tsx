import "server-only";
import type { ReactNode } from "react";
import styles from "./services.module.css";

export const serviceClass = (name: string) => `${styles[name] ?? ""} ${name}`;

export function ServiceMask({ id = "", children, rendered = false }: { id?: string; children: ReactNode; rendered?: boolean }) {
  return (
    <span className={serviceClass("masked-text")} data-masked-reveal={id} data-rendered-lines={rendered || undefined}>
      {rendered ? <span data-reveal-source>{children}</span> : <span className={`${serviceClass("editorial-line")} ${serviceClass("masked-text-line")}`}><span data-reveal-piece>{children}</span></span>}
    </span>
  );
}

export function ServiceLines({ lines }: { lines: readonly string[] }) {
  return lines.map((line) => <span key={line} className={serviceClass("editorial-line")}><span>{line}</span></span>);
}
