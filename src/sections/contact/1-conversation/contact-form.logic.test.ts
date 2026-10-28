import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import * as viewport from "@/lib/viewport-design";
import * as validation from "./contact-validation";
import type { ContactAdapter, ContactField, ContactValues } from "./contact-validation";

/** Count behavior against server-like nodes; no browser, mail, clipboard, timer or real network. */
function harness(adapter: ContactAdapter) {
  class Surface extends EventTarget {
    dataset: Record<string, string> = {};
    style = { height: "", minHeight: "" };
    hidden = false;
    disabled = false;
    textContent = "";
    attributes = new Map<string, string>();
    one = new Map<string, Surface>();
    many = new Map<string, Surface[]>();
    closestMap = new Map<string, Surface>();
    focusCount = 0;
    scrolls: unknown[] = [];
    querySelector(selector: string) { return this.one.get(selector) ?? null; }
    querySelectorAll(selector: string) { return this.many.get(selector) ?? []; }
    closest(selector: string) { return this.closestMap.get(selector) ?? null; }
    setAttribute(key: string, value: string) { this.attributes.set(key, value); }
    getAttribute(key: string) { return this.attributes.get(key) ?? null; }
    removeAttribute(key: string) { this.attributes.delete(key); }
    focus() { this.focusCount++; }
    scrollIntoView(options: unknown) { this.scrolls.push(options); }
    getBoundingClientRect() { return { height: 520 }; }
  }
  class Input extends Surface { value = ""; scrollHeight = 190; }
  class Textarea extends Input {}
  const root = new Surface(), main = new Surface(), form = new Surface(), fieldset = new Surface(), submit = new Surface(), success = new Surface();
  const intro = new Surface(), greeting = new Surface(), greetingName = new Surface(), error = new Surface();
  const inputs = { name: new Input(), email: new Input(), message: new Textarea() };
  const rows = validation.fieldOrder.map((field) => Object.assign(new Surface(), { dataset: { contactField: field, active: String(field === "name") } }));
  const messages = ["nameRequired", "nameLong", "emailRequired", "emailInvalid", "emailLong", "messageRequired", "messageLong"].map((key) => Object.assign(new Surface(), { hidden: true, dataset: { contactError: key } }));
  const labels = ["idle", "validating", "sending", "idle", "validating", "sending"].map((key) => Object.assign(new Surface(), { hidden: key !== "idle", dataset: { contactSubmitLabel: key } }));
  fieldset.disabled = submit.disabled = true;
  success.hidden = greeting.hidden = error.hidden = true;
  root.closestMap.set("main", main);
  root.one.set("[data-contact-form]", form);
  root.one.set("[data-contact-success]", success);
  root.one.set("[data-contact-form-intro]", intro);
  root.one.set("[data-contact-greeting]", greeting);
  root.one.set("[data-contact-greeting-name]", greetingName);
  root.one.set("#conversation", success);
  form.one.set("fieldset", fieldset);
  form.one.set("button[type='submit']", submit);
  form.one.set("[data-contact-error-response]", error);
  form.many.set("[data-contact-field]", rows);
  form.many.set("[data-contact-error]", messages);
  form.many.set("[data-contact-submit-label]", labels);
  Object.assign(form, { elements: { namedItem: (field: ContactField) => inputs[field] }, contains: (node: unknown) => Object.values(inputs).includes(node as Input) || node === submit });
  const window = Object.assign(new EventTarget(), { innerWidth: 1920, matchMedia: () => ({ matches: false }) });
  const context = createContext({ window, Node: Surface, Element: Surface, HTMLInputElement: Input, HTMLTextAreaElement: Textarea, AbortController });
  const compiled = ts.transpileModule(readFileSync(new URL("./contact-form.logic.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const evaluated = { exports: {} };
  runInContext(`(function(require, module, exports) { ${compiled}\n })`, context)((key: string) => {
    if (key === "@/lib/viewport-design") return viewport;
    if (key === "./contact-validation") return validation;
    throw new Error(`Unexpected Contact dependency: ${key}`);
  }, evaluated, evaluated.exports);
  const mount = (evaluated.exports as { mountContactInteractions: (root: Surface, options: { adapter: ContactAdapter }) => () => void }).mountContactInteractions;
  function fire(target: Surface, type: string, eventTarget: Surface = target, relatedTarget?: Surface) {
    const event = new Event(type, { cancelable: true });
    Object.defineProperties(event, { target: { value: eventTarget }, relatedTarget: { value: relatedTarget } });
    target.dispatchEvent(event);
  }
  return {
    root, main, form, fieldset, submit, success, inputs, rows, messages, labels, intro, greeting, greetingName, error, window,
    mount: () => mount(root, { adapter }),
    submitForm: () => fire(form, "submit"),
    input(field: ContactField, value: string) { inputs[field].value = value; fire(form, "input", inputs[field]); },
    focus(field: ContactField) { fire(form, "focusin", inputs[field]); },
    blur(field: ContactField, next?: ContactField) { fire(form, "focusout", inputs[field], next ? inputs[next] : undefined); },
    fill(values: ContactValues) { for (const field of validation.fieldOrder) this.input(field, values[field]); },
    again() { const button = new Surface(); button.closestMap.set("[data-contact-again]", button); fire(root, "click", button); },
    begin() { const link = new Surface(); link.closestMap.set("[data-contact-begin]", link); fire(root, "click", link); },
  };
}
const flush = async () => { for (let count = 0; count < 8; count++) await Promise.resolve(); };
const note = { name: "Reader", email: "reader@example.com", message: "A useful question." };

test("mounted Contact validates before transport and maintains source field/greeting focus behavior", async () => {
  let deliveries = 0;
  const h = harness(async () => { deliveries++; }), dispose = h.mount();
  expect(h.fieldset.disabled).toBe(false);
  h.submitForm(); await flush();
  expect(deliveries).toBe(0);
  expect(h.inputs.name.focusCount).toBe(1);
  expect(h.messages.filter((message) => !message.hidden).map((message) => message.dataset.contactError)).toEqual(["nameRequired", "emailRequired", "messageRequired"]);
  h.input("name", "  Reader  ");
  expect(h.greetingName.textContent).toBe("Reader");
  expect(h.intro.hidden).toBe(true);
  expect(h.greeting.hidden).toBe(false);
  h.focus("email");
  expect(h.main.getAttribute("data-contact-focused")).toBe("true");
  expect(h.rows.map((row) => row.dataset.active)).toEqual(["false", "true", "false"]);
  h.blur("email", "message");
  expect(h.main.getAttribute("data-contact-focused")).toBe("true");
  h.blur("message");
  expect(h.main.getAttribute("data-contact-focused")).toBe("false");
  dispose();
  expect(h.fieldset.disabled).toBe(true);
  expect(h.main.getAttribute("data-contact-focused")).toBeNull();
});

test("mounted Contact confirms once, preserves height, clears values and reopens without another delivery", async () => {
  const delivered: ContactValues[] = [];
  let confirm!: () => void;
  const h = harness((values) => { delivered.push(values); return new Promise<void>((resolve) => { confirm = resolve; }); }), dispose = h.mount();
  h.fill(note); h.submitForm(); h.submitForm(); await flush();
  expect(delivered).toEqual([note]);
  expect(h.root.dataset.contactStatus).toBe("sending");
  expect(h.fieldset.disabled).toBe(true);
  expect(h.labels.filter((label) => !label.hidden).map((label) => label.dataset.contactSubmitLabel)).toEqual(["sending", "sending"]);
  confirm(); await flush();
  expect(h.root.dataset.contactStatus).toBe("success");
  expect(h.success.hidden).toBe(false);
  expect(h.form.hidden).toBe(true);
  expect(h.success.focusCount).toBe(1);
  expect(Number.parseFloat(h.success.style.minHeight)).toBeCloseTo(520 / 1920 * 100, 12);
  expect(Object.values(h.inputs).map((input) => input.value)).toEqual(["", "", ""]);
  h.again();
  expect(h.form.hidden).toBe(false);
  expect(h.success.hidden).toBe(true);
  expect(delivered).toHaveLength(1);
  dispose();
});

test("mounted Contact keeps a failed note, recovers on edit, and aborts without adopting stale success", async () => {
  let signal!: AbortSignal;
  let complete!: () => void;
  let reject = true;
  const h = harness((_values, pending) => {
    signal = pending;
    if (reject) return Promise.reject(new Error("Unconfigured transport"));
    return new Promise<void>((resolve) => { complete = resolve; });
  }), dispose = h.mount();
  h.fill(note); h.submitForm(); await flush();
  expect(h.error.hidden).toBe(false);
  expect(h.inputs.message.value).toBe(note.message);
  expect(h.fieldset.disabled).toBe(false);
  h.input("message", "A revised note.");
  expect(h.error.hidden).toBe(true);
  reject = false; h.submitForm(); await flush();
  dispose();
  expect(signal.aborted).toBe(true);
  complete(); await flush();
  expect(h.success.hidden).toBe(true);
  expect(h.root.dataset.contactInteractive).toBeUndefined();
  expect(h.inputs.message.value).toBe("A revised note.");
});

test("retry success retains the painted error-expanded form height before synchronous status changes", async () => {
  for (const width of [1920, 768, 412]) {
    let attempt = 0;
    let confirm!: () => void;
    const h = harness(() => ++attempt === 1 ? Promise.reject(new Error("Unavailable")) : new Promise<void>((resolve) => { confirm = resolve; }));
    h.window.innerWidth = width;
    h.form.getBoundingClientRect = () => ({ height: 520 + (h.error.hidden ? 0 : 41.1333) });
    const dispose = h.mount();
    h.fill(note); h.submitForm(); await flush();
    expect(h.error.hidden).toBe(false);
    h.submitForm(); await flush();
    expect(h.root.dataset.contactStatus).toBe("sending");
    expect(h.error.hidden).toBe(true);
    expect(Number.parseFloat(h.success.style.minHeight)).toBeCloseTo(561.1333 / width * 100, 10);
    confirm(); await flush();
    expect(h.success.hidden).toBe(false);
    expect(Number.parseFloat(h.success.style.minHeight)).toBeCloseTo(561.1333 / width * 100, 10);
    dispose();
  }
});

test("mounted Contact normalizes textarea measurements once and retains reduced-motion cue behavior", () => {
  const h = harness(async () => {}), dispose = h.mount();
  h.window.innerWidth = 960;
  h.inputs.message.scrollHeight = 700;
  h.input("message", "A long note.");
  expect(Number.parseFloat(h.inputs.message.style.height)).toBeCloseTo(440 / 768 * 100, 12);
  h.window.matchMedia = () => ({ matches: true });
  h.begin();
  expect(h.success.scrolls.at(-1)).toEqual({ behavior: "instant" });
  dispose();
  expect(h.inputs.message.style.height).toBe("");
});
