import { expect, test } from "bun:test";
import { contactTransport, validateContact, type ContactValues } from "./contact-validation";

const note = { name: "A reader", email: "reader@example.com", message: "A useful first question." };

test("Contact retains source required-field order, syntax and raw-length boundaries", () => {
  expect(validateContact({ name: " \n", email: " ", message: "\t" })).toEqual({ name: "nameRequired", email: "emailRequired", message: "messageRequired" });
  expect(validateContact(note)).toEqual({});
  expect(validateContact({ name: " ".repeat(10) + "A", email: " reader@example.com ", message: " question " })).toEqual({});
  for (const email of ["reader", "reader@", "reader@example", "a@@example.com", "a b@example.com"]) {
    expect(validateContact({ ...note, email })).toEqual({ email: "emailInvalid" });
  }
  expect(validateContact({ ...note, name: "a".repeat(100), email: `${"a".repeat(242)}@example.com`, message: "a".repeat(5000) })).toEqual({});
  expect(validateContact({ name: "a".repeat(101), email: `${"a".repeat(243)}@example.com`, message: "a".repeat(5001) })).toEqual({ name: "nameLong", email: "emailLong", message: "messageLong" });
});

test("Contact adapter sends only to local API and requires explicit delivery confirmation", async () => {
  const requests: { url: unknown; options: RequestInit | undefined }[] = [];
  let result: unknown = { ok: true };
  let status = 200;
  const request = (async (url: unknown, options?: RequestInit) => {
    requests.push({ url, options });
    return new Response(JSON.stringify(result), { status, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
  const adapter = contactTransport(request);
  const abort = new AbortController();
  await adapter(note, abort.signal);
  expect(requests[0]).toEqual({ url: "/api/send-message", options: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(note), signal: abort.signal } });
  for (result of [{ ok: false }, {}, null, { ok: "true" }]) await expect(adapter(note, abort.signal)).rejects.toThrow("not confirmed");
  result = { ok: true }; status = 503;
  await expect(adapter(note, abort.signal)).rejects.toThrow("delivery failed");
});

test("Contact never treats an aborted or malformed transport result as confirmation", async () => {
  const abort = new AbortController(); abort.abort();
  const request = (async (_url: unknown, options?: RequestInit) => {
    expect(options?.signal).toBe(abort.signal);
    throw new DOMException("Aborted", "AbortError");
  }) as unknown as typeof fetch;
  await expect(contactTransport(request)(note as ContactValues, abort.signal)).rejects.toThrow("Aborted");
  const invalid = (async () => new Response("not JSON")) as unknown as typeof fetch;
  await expect(contactTransport(invalid)(note, new AbortController().signal)).rejects.toThrow();
});
