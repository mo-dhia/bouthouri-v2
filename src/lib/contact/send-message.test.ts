import { describe, expect, test } from "bun:test";
import { deliverContactMessage, parseContactMessage } from "./send-message";
describe("contact delivery", () => {
  const valid = { name: "Reader Name", email: "reader@example.com", message: "A project worth discussing." };
  test("validates all fields before any delivery", () => {
    expect(parseContactMessage({ ...valid, name: "  Reader Name  " })).toEqual(valid);
    expect(parseContactMessage({ ...valid, name: "A", message: "A" })).not.toBeNull();
    for (const value of [null, {}, { ...valid, email: "not-an-email" }, { ...valid, name: " " }, { ...valid, message: " " }, { ...valid, message: "x".repeat(5001) }, { ...valid, name: "x".repeat(101) }]) expect(parseContactMessage(value)).toBeNull();
  });
  test("uses branded recipient and reply-to without HTML injection", async () => {
    let payload: Record<string, unknown> = {};
    const send = (async (url: string | URL | Request, init?: RequestInit) => {
      expect(url).toBe("https://api.resend.com/emails"); payload = JSON.parse(String(init?.body));
      return Response.json({ id: "test-delivery" });
    }) as typeof fetch;
    await deliverContactMessage(valid, { apiKey: "test-key", from: "Website <website@example.com>", to: "contact@bouthouri.co" }, send);
    expect(payload.to).toEqual(["contact@bouthouri.co"]); expect(payload.reply_to).toBe(valid.email); expect(payload.text).toContain(valid.message); expect(payload.html).toBeUndefined();
  });
  test("rejects unconfirmed delivery instead of showing a false success", async () => {
    for (const response of [new Response("failure", { status: 500 }), Response.json({})]) {
      await expect(deliverContactMessage(valid, { apiKey: "test-key", from: "sender@example.com", to: "contact@bouthouri.co" }, (async () => response) as unknown as typeof fetch)).rejects.toThrow();
    }
  });
});
