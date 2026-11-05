import { createHash } from "crypto";
import { getJSON, increment, pushToList } from "../../../lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PER_DAY = 5;
const fail = (error, status = 400) => Response.json({ error }, { status });
const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Sends a visitor a link to their free report. Needs your own domain verified in Resend,
// with NOTIFY_FROM set (e.g. "DoesAISeeMyStore <hello@doesaiseemystore.com>").
export async function POST(req) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM;
  if (process.env.NEXT_PUBLIC_EMAIL_REPORTS !== "1" || !key || !from) return fail("Emailing reports isn't switched on yet.", 503);

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Something went wrong. Please try again.");
  }
  const email = String(body.email || "").trim().slice(0, 120);
  const reportId = String(body.reportId || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 20);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Please enter a valid email address.");
  if (body.agree !== true) return fail("Please tick the box to agree to receive the email.");

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const ipKey = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const day = new Date().toISOString().slice(0, 10);

  try {
    const n = await increment(`limit:emailreport:${ipKey}:${day}`, 2 * 24 * 60 * 60);
    if (n > PER_DAY) return fail("You've sent a few of these today. Please try again tomorrow.", 429);

    const report = await getJSON(`report:${reportId}`);
    if (!report) return fail("We couldn't find that report. It may have expired.", 404);

    const site = process.env.SITE_URL || "https://www.doesaiseemystore.com";
    const link = `${site}/report/${reportId}`;
    const subject = `Your AI visibility report for ${report.shop.name}`;
    const html = `
    <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:560px;color:#111">
      <h2 style="margin:0 0 12px">Your AI visibility report</h2>
      <p>Here's the report for <b>${esc(report.shop.name)}</b>. You scored <b>${report.overall}/100</b> (${esc(report.label)}).</p>
      <p><a href="${link}" style="display:inline-block;background:#4f7cff;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">View your report</a></p>
      <p>Want the full picture? Press "Get my full report free" on your report and we'll send it over.</p>
      <p style="color:#666;font-size:13px">You're getting this because you asked for it on doesaiseemystore.com. Questions? Just reply to this email.</p>
    </div>`;
    const text = `Your AI visibility report for ${report.shop.name}: ${report.overall}/100 (${report.label}).\n\nView it here: ${link}\n\nQuestions? Just reply to this email.`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        reply_to: process.env.NOTIFY_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || undefined,
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("Report email failed:", res.status, (await res.text()).slice(0, 300));
      return fail("We couldn't send that right now. Please try again in a minute.", 502);
    }

    // Only keep the email if they ticked the optional tips box.
    if (body.tips === true) {
      await pushToList("subscribers", { at: new Date().toISOString(), email, domain: report.shop.domain }, 5000);
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Email report failed:", e);
    return fail("We couldn't send that right now. Please try again in a minute.", 500);
  }
}
