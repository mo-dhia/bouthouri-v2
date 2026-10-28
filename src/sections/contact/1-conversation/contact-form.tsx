import "server-only";

import { KineticButton } from "@/components/layout/header/kinetic-link";
import { brand } from "@/config/brand";
import type { ContactCopy } from "./contact.content";
import { fieldOrder, type ContactField } from "./contact-validation";
import styles from "./contact.module.css";

export default function ContactForm({ copy }: { copy: ContactCopy }) {
  return (
    <section id="conversation" className={styles["contact-conversation"]} data-contact-conversation="true" aria-labelledby="contact-form-index">
      <div className={styles["conversation-heading"]}>
        <span id="contact-form-index" className={`${styles["editorial-eyebrow"]} editorial-eyebrow`}>{copy.formIndex}</span>
        <p>
          <span data-contact-form-intro="true">{copy.formIntro}</span>
          <span data-contact-greeting="true" className={styles["contact-greeting"]} hidden>{copy.greeting} <bdi data-contact-greeting-name="true" />.</span>
        </p>
      </div>
      <form method="post" action="/api/send-message" noValidate aria-busy="false" data-contact-form="true">
        <fieldset disabled>
          {fieldOrder.map((field, index) => <Field key={field} field={field} index={index} copy={copy} />)}
          <div className={styles["contact-submit-row"]}>
            <KineticButton type="submit" disabled className={styles["contact-submit"]}>
              <span data-contact-submit-label="idle">{copy.submit}</span>
              <span data-contact-submit-label="validating" hidden>{copy.validating}</span>
              <span data-contact-submit-label="sending" hidden>{copy.sending}</span>
            </KineticButton>
          </div>
        </fieldset>
        <div className={styles["contact-response"]} role="status" aria-live="polite">
          <div data-contact-error-response="true" hidden>
            <p>{copy.error}</p><a href={`mailto:${brand.email}`} dir="ltr">{brand.email}</a>
          </div>
        </div>
      </form>
      <div className={styles["contact-success"]} data-contact-success="true" role="status" tabIndex={-1} hidden>
        <h2>{copy.success.map((line) => <span key={line}>{line}</span>)}</h2>
        <p>{copy.successCopy}</p>
        <KineticButton type="button" data-contact-again="true">{copy.again}</KineticButton>
      </div>
    </section>
  );
}

function Field({ field, index, copy }: { field: ContactField; index: number; copy: ContactCopy }) {
  const common = {
    id: `contact-${field}`,
    name: field,
    required: true,
    placeholder: copy.fields[field].placeholder,
    "aria-invalid": false as const,
    "aria-describedby": `error-${field}`,
  };
  return (
    <div className={styles["contact-field"]} data-contact-field={field} data-active={index === 0}>
      <label htmlFor={common.id}><bdi dir="ltr">0{index + 1}</bdi><span>{copy.fields[field].label}</span></label>
      <div className={styles["contact-input-wrap"]}>
        {field === "message" ? (
          <textarea {...common} rows={4} maxLength={10000} defaultValue="" />
        ) : (
          <input
            {...common}
            type={field === "email" ? "email" : "text"}
            inputMode={field === "email" ? "email" : "text"}
            autoComplete={field}
            autoCapitalize={field === "email" ? "none" : "words"}
            spellCheck={field !== "email"}
            dir={field === "email" ? "ltr" : undefined}
            maxLength={500}
            defaultValue=""
          />
        )}
        <span className={styles["contact-field-rule"]} aria-hidden="true" />
        <span className={styles["contact-field-error"]} id={`error-${field}`} aria-live="polite">
          {Object.entries(copy.errors).filter(([key]) => key.startsWith(field)).map(([key, message]) => (
            <span key={key} data-contact-error={key} hidden>{message}</span>
          ))}
        </span>
      </div>
    </div>
  );
}
