import type { Dictionary } from "@/i18n/dictionaries";
import styles from "./perspective.module.css";

export default function Perspective({ copy }: { copy: Dictionary["vision"] }) {
  return (
    <section className={styles.perspective} id="perspective" aria-labelledby="perspective-title">
      <p className={styles.eyebrow}>{copy.eyebrow}</p>
      <h2 id="perspective-title">{copy.title}</h2>
      <p className={styles.description}>{copy.description}</p>
    </section>
  );
}
