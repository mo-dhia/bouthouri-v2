import type { Dictionary } from "@/i18n/dictionaries";
import styles from "./footer.module.css";

export default function Footer({ copy }: { copy: Dictionary["footer"] }) {
  return <footer className={styles.footer}><span>© {copy.copyright}</span><a href="#top">{copy.top} ↑</a></footer>;
}
