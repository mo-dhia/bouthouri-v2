import "server-only";
import EnvironmentGate from "./environment-gate";
import styles from "./environment.module.css";

/** Decorative parking only; route content remains in its server composition. */
export default function Environment({ locale }: { locale: string }) {
  return <div className={styles.parking} data-environment-parking={locale} aria-hidden="true"><EnvironmentGate locale={locale} /></div>;
}
