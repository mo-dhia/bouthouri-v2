export type ContactMessage = { name: string; email: string; message: string };
export function parseContactMessage(value: unknown): ContactMessage | null {
  if (!value || typeof value !== "object") return null;
  const fields = value as Record<string, unknown>;
  if (!["name", "email", "message"].every(key => typeof fields[key] === "string")) return null;
  const name = (fields.name as string).trim(), email = (fields.email as string).trim(), message = (fields.message as string).trim();
  if (!name || (fields.name as string).length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message || (fields.message as string).length > 5000) return null;
  return { name, email, message };
}
/** Delivery succeeds only after the configured mail service accepts the message. */
export async function deliverContactMessage(message: ContactMessage, config: { apiKey: string; from: string; to: string }, send: typeof fetch = fetch) {
  const response = await send("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: config.from, to: [config.to], reply_to: message.email, subject: `Website enquiry — ${message.name}`, text: `Name: ${message.name}\nEmail: ${message.email}\n\n${message.message}` }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Contact delivery was not accepted");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string") throw new Error("Contact delivery was not confirmed");
}
