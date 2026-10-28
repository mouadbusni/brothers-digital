import { env } from "cloudflare:workers";
import { validateInquiry } from "../../../lib/inquiries";

const json = (body: unknown, status = 200, extra: Record<string,string> = {}) => Response.json(body, { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "invalid_origin" }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return json({ error: "invalid_content_type" }, 415);
  const raw = await request.text();
  if (raw.length > 12000) return json({ error: "request_too_large" }, 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json({ error: "invalid_json" }, 400); }
  const result = validateInquiry(body);
  if ("spam" in result) return json({ ok: true, id: "received" }, 202);
  if ("error" in result) return json({ error: result.error }, 400);
  if (!env.DB) return json({ error: "temporarily_unavailable" }, 503);
  const data = result.data;
  try {
    const existing = await env.DB.prepare("SELECT id FROM inquiries WHERE id = ?").bind(data.id).first<{id:string}>();
    if (existing) return json({ ok: true, id: existing.id });
    const windowKey = Math.floor(Date.now() / 600000);
    const address = request.headers.get("cf-connecting-ip") || "local-preview";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${env.RATE_LIMIT_SALT || "preview-only"}:${windowKey}:${address}`));
    const fingerprint = [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2,"0")).join("");
    const now = Math.floor(Date.now()/1000);
    const rate = await env.DB.prepare("INSERT INTO inquiry_limits (fingerprint,hits,expires_at) VALUES (?,1,?) ON CONFLICT(fingerprint) DO UPDATE SET hits=hits+1 RETURNING hits").bind(fingerprint,now+1200).first<{hits:number}>();
    if (rate && rate.hits > 5) return json({ error: "rate_limited" },429,{"retry-after":"600"});
    await env.DB.batch([
      env.DB.prepare("DELETE FROM inquiry_limits WHERE expires_at < ?").bind(now),
      env.DB.prepare("INSERT INTO inquiries (id,created_at,name,email,services,message,timeframe,language,notification_status) VALUES (?,?,?,?,?,?,?,?,?)").bind(data.id,new Date().toISOString(),data.name,data.email,JSON.stringify(data.services),data.message,data.timeframe,data.language,"not_configured"),
    ]);
    if (env.RESEND_API_KEY && env.CONTACT_TO_EMAIL && env.CONTACT_FROM_EMAIL) {
      // Notifications are enabled only after the owner configures a verified sender and recipient.
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method:"POST",headers:{"authorization":`Bearer ${env.RESEND_API_KEY}`,"content-type":"application/json","idempotency-key":`inquiry-${data.id}`},
          body:JSON.stringify({from:env.CONTACT_FROM_EMAIL,to:[env.CONTACT_TO_EMAIL],reply_to:data.email,subject:`Brothers Digital — ${data.services.join(" / ")}`,text:`Nouvelle demande ${data.id}\n\n${data.name}\n${data.email}\n\n${data.message}\n\nHorizon : ${data.timeframe}`}),
          signal:AbortSignal.timeout(8000),
        });
        await env.DB.prepare("UPDATE inquiries SET notification_status = ? WHERE id = ?").bind(response.ok?"sent":"failed",data.id).run();
      } catch { await env.DB.prepare("UPDATE inquiries SET notification_status = 'failed' WHERE id = ?").bind(data.id).run(); }
    }
    return json({ ok: true, id: data.id }, 201);
  } catch {
    // Do not print names, emails, message bodies or IP addresses to application logs.
    return json({ error: "temporarily_unavailable" }, 503);
  }
}
