import { brand } from "@/config/brand";
import { deliverContactMessage, parseContactMessage } from "@/lib/contact/send-message";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(request.url).origin !== origin) return Response.json({ ok: false }, { status: 403 });
  if (Number(request.headers.get("content-length")) > 20000) return Response.json({ ok: false }, { status: 413 });
  let raw: string;
  try { raw = await request.text(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (raw.length > 20000) return Response.json({ ok: false }, { status: 413 });
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return Response.json({ ok: false }, { status: 400 }); }
  const message = parseContactMessage(data);
  if (!message) return Response.json({ ok: false }, { status: 422 });
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) return Response.json({ ok: false }, { status: 503 });
  try { await deliverContactMessage(message, { apiKey, from, to: brand.email }); }
  catch { return Response.json({ ok: false }, { status: 502 }); }
  return Response.json({ ok: true });
}
