import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./kinetic.module.css";
import NavInk from "./nav-ink";

export default function KineticLink({
  href,
  children,
  className = "",
  variant = "editorial",
  navLabel = false,
  ...props
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "editorial" | "rollover" | "static";
  navLabel?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href" | "className">) {
  return (
    <a
      {...props}
      href={href}
      className={`${styles.action} ${styles[variant]} ${className}`}
      data-kinetic={variant}
      data-material-sound="true"
    >
      <span className={styles.window} data-locale-text="true">
        <span className={styles.label}>
          {navLabel ? <NavInk>{String(children)}</NavInk> : children}
        </span>
        {variant !== "static" && (
          <span className={styles.echo} aria-hidden="true">
            {navLabel ? <NavInk>{String(children)}</NavInk> : children}
          </span>
        )}
      </span>
      {variant === "editorial" && (
        <i className={styles.boundary} aria-hidden="true" />
      )}
    </a>
  );
}

/** Server-renderable form control sharing the editorial rollover treatment. */
export function KineticButton({ children, className = "", variant = "editorial", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "editorial" | "rollover" | "static" }) {
  return <button {...props} type={type} className={`${styles.action} ${styles[variant]} ${className}`} data-kinetic={variant} data-material-sound="true">
    <span className={styles.window} data-locale-text="true"><span className={styles.label}>{children}</span>{variant !== "static" && <span className={styles.echo} aria-hidden="true">{children}</span>}</span>
    {variant === "editorial" && <i className={styles.boundary} aria-hidden="true" />}
  </button>;
}
