import styles from "./header.module.css";

/** The zero-sized inline marker exposes the real font baseline to the controller. */
export default function NavInk({ children }: { children: string }) {
  return (
    <span className={styles.navInk} data-nav-ink="true">
      {children}
      <i
        className={styles.navInkBaseline}
        data-nav-ink-baseline="true"
        aria-hidden="true"
      />
    </span>
  );
}
