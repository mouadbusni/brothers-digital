import { validateInquiry } from "./inquiries.ts";
import { readInquiryBody } from "./inquiry-body.ts";

type InquiryEnvironment = { DB?: D1Database; RATE_LIMIT_SALT?: string; RESEND_API_KEY?: string; CONTACT_TO_EMAIL?: string; CONTACT_FROM_EMAIL?: string };
type StoredInquiry = { id: string; name: string; email: string; services: string; message: string; timeframe: string };
function sameInquiry(row: StoredInquiry, data: NonNullable<ReturnType<typeof validateInquiry>["data"]>) {
  return row.name === data.name && row.email === data.email && row.message === data.message && row.timeframe === data.timeframe
    && JSON.stringify(JSON.parse(row.services).sort()) === JSON.stringify([...data.services].sort());
}

const json = (body: unknown, status = 200, extra: Record<string,string> = {}) => Response.json(body, { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra } });

export async function handleInquiry(request: Request, env: InquiryEnvironment) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "invalid_origin" }, 403);
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") return json({ error: "invalid_content_type" }, 415);
  const parsed = await readInquiryBody(request);
  if ("error" in parsed) return json({ error: parsed.error }, parsed.status);
  const body = parsed.body;
  const result = validateInquiry(body);
  if ("spam" in result) return json({ ok: true, id: "received" }, 202);
  if ("error" in result) return json({ error: result.error }, 400);
  if (!env.DB) return json({ error: "temporarily_unavailable" }, 503);
  const data = result.data;
  const findExisting = () => env.DB!.prepare("SELECT id,name,email,services,message,timeframe FROM inquiries WHERE id = ?").bind(data.id).first<StoredInquiry>();
  const replay = (row: StoredInquiry) => sameInquiry(row, data)
    ? json({ ok: true, id: data.id }) : json({ error: "submission_conflict" }, 409);
  try {
    const existing = await findExisting();
    if (existing) return replay(existing);
    const windowKey = Math.floor(Date.now() / 600000);
    const address = request.headers.get("cf-connecting-ip") || "local-preview";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${env.RATE_LIMIT_SALT || "preview-only"}:${windowKey}:${address}`));
    const fingerprint = [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2,"0")).join("");
    const now = Math.floor(Date.now()/1000);
    const rate = await env.DB.prepare("INSERT INTO inquiry_limits (fingerprint,hits,expires_at) VALUES (?,1,?) ON CONFLICT(fingerprint) DO UPDATE SET hits=hits+1 RETURNING hits").bind(fingerprint,now+1200).first<{hits:number}>();
    if (rate && rate.hits > 5) return json({ error: "rate_limited" },429,{"retry-after":"600"});
    const saved = await env.DB.batch([
      env.DB.prepare("DELETE FROM inquiry_limits WHERE expires_at < ?").bind(now),
      env.DB.prepare("INSERT INTO inquiries (id,created_at,name,email,services,message,timeframe,language,notification_status) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING").bind(data.id,new Date().toISOString(),data.name,data.email,JSON.stringify(data.services),data.message,data.timeframe,data.language,"not_configured"),
    ]);
    // Concurrent retries must acknowledge the original record, never insert twice.
    if (saved[1].meta.changes === 0) {
      const existing = await findExisting();
      return existing ? replay(existing) : json({ error: "temporarily_unavailable" }, 503);
    }
    if (env.RESEND_API_KEY && env.CONTACT_TO_EMAIL && env.CONTACT_FROM_EMAIL) {
      // Notifications are enabled only after the owner configures a verified sender and recipient.
      let notificationStatus = "failed";
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method:"POST",headers:{"authorization":`Bearer ${env.RESEND_API_KEY}`,"content-type":"application/json","idempotency-key":`inquiry-${data.id}`},
          body:JSON.stringify({from:env.CONTACT_FROM_EMAIL,to:[env.CONTACT_TO_EMAIL],reply_to:data.email,subject:`Brothers Digital — ${data.services.join(" / ")}`,text:`Nouvelle demande ${data.id}\n\n${data.name}\n${data.email}\n\n${data.message}\n\nHorizon : ${data.timeframe}`}),
          signal:AbortSignal.timeout(8000),
        });
        notificationStatus = response.ok ? "sent" : "failed";
      } catch { /* The enquiry is already durable; delivery failure must not undo success. */ }
      await env.DB.prepare("UPDATE inquiries SET notification_status = ? WHERE id = ?").bind(notificationStatus,data.id).run().catch(() => undefined);
    }
    return json({ ok: true, id: data.id }, 201);
  } catch {
    // Do not print names, emails, message bodies or IP addresses to application logs.
    return json({ error: "temporarily_unavailable" }, 503);
  }
}
