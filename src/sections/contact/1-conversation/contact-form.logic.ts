import { designPixels, pixelsToVw } from "@/lib/viewport-design";
import {
  contactTransport,
  fieldOrder,
  validateContact,
  type ContactAdapter,
  type ContactError,
  type ContactField,
  type ContactValues,
} from "./contact-validation";

type FormStatus = "idle" | "validating" | "sending" | "error" | "success";
type FormControl = HTMLInputElement | HTMLTextAreaElement;
const scrollBehavior = (): ScrollBehavior => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";

/** Imperative enhancement of complete server markup. No render or store update per input/scroll frame. */
export function mountContactInteractions(root: HTMLElement, { adapter = contactTransport() }: { adapter?: ContactAdapter } = {}) {
  const form = root.querySelector<HTMLFormElement>("[data-contact-form]");
  const success = root.querySelector<HTMLElement>("[data-contact-success]");
  const fieldset = form?.querySelector("fieldset");
  const submit = form?.querySelector<HTMLButtonElement>("button[type='submit']");
  if (!form || !success || !fieldset || !submit) return () => {};
  const inputs = Object.fromEntries(fieldOrder.map((field) => [field, form.elements.namedItem(field)])) as Record<ContactField, FormControl>;
  if (fieldOrder.some((field) => !(inputs[field] instanceof HTMLInputElement || inputs[field] instanceof HTMLTextAreaElement))) return () => {};
  const fieldRows = [...form.querySelectorAll<HTMLElement>("[data-contact-field]")];
  const errorMessages = [...form.querySelectorAll<HTMLElement>("[data-contact-error]")];
  const submitLabels = [...form.querySelectorAll<HTMLElement>("[data-contact-submit-label]")];
  const errorResponse = form.querySelector<HTMLElement>("[data-contact-error-response]");
  const intro = root.querySelector<HTMLElement>("[data-contact-form-intro]");
  const greeting = root.querySelector<HTMLElement>("[data-contact-greeting]");
  const greetingName = root.querySelector<HTMLElement>("[data-contact-greeting-name]");
  const main = root.closest("main");
  const priorFocus = main?.getAttribute("data-contact-focused");
  const priorDisabled = fieldset.disabled;
  const priorSubmitDisabled = submit.disabled;
  const priorHeight = inputs.message.style.height;
  const priorSuccessHeight = success.style.minHeight;
  const cleanups: (() => void)[] = [];
  let status: FormStatus = "idle";
  let alive = true;
  let pending: AbortController | undefined;

  function listen(target: EventTarget, type: string, handler: EventListener) {
    target.addEventListener(type, handler);
    cleanups.push(() => target.removeEventListener(type, handler));
  }
  function readValues(): ContactValues {
    return { name: inputs.name.value, email: inputs.email.value, message: inputs.message.value };
  }
  function setFocused(focused: boolean) { main?.setAttribute("data-contact-focused", String(focused)); }
  function setStatus(next: FormStatus) {
    status = next;
    const busy = next === "validating" || next === "sending";
    form!.setAttribute("aria-busy", String(busy));
    fieldset!.disabled = busy;
    submit!.disabled = busy;
    for (const label of submitLabels) label.hidden = label.dataset.contactSubmitLabel !== (busy ? next : "idle");
    if (errorResponse) errorResponse.hidden = next !== "error";
    form!.hidden = next === "success";
    success!.hidden = next !== "success";
    root.dataset.contactStatus = next;
  }
  function setError(field: ContactField, error?: ContactError) {
    inputs[field].setAttribute("aria-invalid", String(!!error));
    for (const message of errorMessages) {
      if (message.dataset.contactError?.startsWith(field)) message.hidden = message.dataset.contactError !== error;
    }
  }
  function updateGreeting() {
    const name = inputs.name.value.trim();
    if (greetingName) greetingName.textContent = name.slice(0, 60);
    if (intro) intro.hidden = !!name;
    if (greeting) greeting.hidden = !name;
  }
  function resizeMessage() {
    const message = inputs.message;
    message.style.height = "auto";
    // scrollHeight is already in actual CSS pixels. Convert only the bounds,
    // then cross once into vw when writing the resulting measured rectangle.
    const width = window.innerWidth;
    const height = Math.min(designPixels(440, width), Math.max(designPixels(160, width), message.scrollHeight));
    message.style.height = pixelsToVw(height, width);
  }
  function getControl(target: EventTarget | null): { field: ContactField; control: FormControl } | null {
    const field = fieldOrder.find((field) => inputs[field] === target);
    return field ? { field, control: inputs[field] } : null;
  }

  listen(form, "focusin", (event) => {
    setFocused(true);
    const active = getControl(event.target);
    if (active) for (const row of fieldRows) row.dataset.active = String(row.dataset.contactField === active.field);
  });
  listen(form, "focusout", (event) => {
    const control = getControl(event.target);
    if (control) setError(control.field, validateContact(readValues())[control.field]);
    const next = (event as FocusEvent).relatedTarget;
    if (!(next instanceof Node) || !form.contains(next)) setFocused(false);
  });
  listen(form, "input", (event) => {
    const control = getControl(event.target);
    if (!control) return;
    setError(control.field);
    if (status === "error") setStatus("idle");
    if (control.field === "name") updateGreeting();
    if (control.field === "message") resizeMessage();
  });
  listen(form, "submit", (event) => {
    event.preventDefault();
    if (!alive || status === "validating" || status === "sending") return;
    // Source React batches the status/error changes until this handler returns.
    // Retain that painted form height before the imperative updates hide a
    // previous delivery error or validation rows during a retry.
    const submittedHeight = form.getBoundingClientRect().height;
    setStatus("validating");
    const values = readValues();
    const errors = validateContact(values);
    for (const field of fieldOrder) setError(field, errors[field]);
    const invalid = fieldOrder.find((field) => errors[field]);
    if (invalid) {
      setStatus("idle");
      inputs[invalid].focus();
      return;
    }
    pending?.abort();
    const delivery = new AbortController();
    pending = delivery;
    success.style.minHeight = pixelsToVw(submittedHeight, window.innerWidth);
    setStatus("sending");
    // Defer adoption through a promise so a synchronous mock failure follows
    // the same recovery/abort path as a rejected browser transport.
    void Promise.resolve().then(() => {
      if (!alive || delivery.signal.aborted) return;
      return adapter(values, delivery.signal);
    }).then(() => {
      if (!alive || delivery.signal.aborted) return;
      for (const field of fieldOrder) inputs[field].value = "";
      updateGreeting();
      setStatus("success");
      inputs.message.style.height = priorHeight;
      setFocused(false);
      success.focus({ preventScroll: true });
      success.scrollIntoView({ block: "start", behavior: scrollBehavior() });
    }).catch(() => {
      if (alive && !delivery.signal.aborted) setStatus("error");
    });
  });
  listen(root, "click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-contact-again]")) {
      setStatus("idle");
      return;
    }
    if (target.closest("[data-contact-begin]")) {
      event.preventDefault();
      root.querySelector("#conversation")?.scrollIntoView({ behavior: scrollBehavior() });
    }
  });
  listen(window, "resize", () => {
    if (inputs.message.style.height) resizeMessage();
  });
  setStatus("idle");
  updateGreeting();
  root.dataset.contactInteractive = "true";

  return () => {
    alive = false;
    pending?.abort();
    cleanups.forEach((cleanup) => cleanup());
    fieldset.disabled = priorDisabled;
    submit.disabled = priorSubmitDisabled;
    form.setAttribute("aria-busy", "false");
    form.hidden = false;
    success.hidden = true;
    success.style.minHeight = priorSuccessHeight;
    inputs.message.style.height = priorHeight;
    for (const field of fieldOrder) setError(field);
    for (const row of fieldRows) row.dataset.active = String(row.dataset.contactField === "name");
    for (const label of submitLabels) label.hidden = label.dataset.contactSubmitLabel !== "idle";
    if (errorResponse) errorResponse.hidden = true;
    if (main) {
      if (priorFocus === null || priorFocus === undefined) main.removeAttribute("data-contact-focused");
      else main.setAttribute("data-contact-focused", priorFocus);
    }
    delete root.dataset.contactInteractive;
    delete root.dataset.contactStatus;
  };
}
