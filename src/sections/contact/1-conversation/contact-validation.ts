export const fieldOrder = ["name", "email", "message"] as const;
export type ContactField = typeof fieldOrder[number];
export type ContactValues = Record<ContactField, string>;
export type ContactError = "nameRequired" | "nameLong" | "emailRequired" | "emailInvalid" | "emailLong" | "messageRequired" | "messageLong";
export type ContactErrors = Partial<Record<ContactField, ContactError>>;

/** Keep source validation order and raw-length checks; trim only for presence/email syntax. */
export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  if (!values.name.trim()) errors.name = "nameRequired";
  else if (values.name.length > 100) errors.name = "nameLong";
  if (!values.email.trim()) errors.email = "emailRequired";
  else if (values.email.length > 254) errors.email = "emailLong";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "emailInvalid";
  if (!values.message.trim()) errors.message = "messageRequired";
  else if (values.message.length > 5000) errors.message = "messageLong";
  return errors;
}

export type ContactAdapter = (values: ContactValues, signal: AbortSignal) => Promise<void>;

/** The local API is root-owned. Confirmation is required before displaying the source success state. */
export function contactTransport(request: typeof fetch = fetch): ContactAdapter {
  return async (values, signal) => {
    const response = await request("/api/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
      signal,
    });
    if (!response.ok) throw new Error("Contact delivery failed");
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true)
      throw new Error("Contact delivery was not confirmed");
  };
}
