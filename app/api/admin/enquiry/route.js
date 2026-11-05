import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { OWNER_COOKIE, isOwner } from "../../../../lib/limits";
import { getJSON, setJSON } from "../../../../lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["new", "sent", "feedback", "done"];
const fail = (error, status = 400) => Response.json({ error }, { status });
const clean = (v, max = 200) => String(v || "").trim().slice(0, max);

// Owner only: change an enquiry's status, or send the client their full report.
export async function POST(req) {
  const jar = await cookies();
  if (!isOwner(jar.get(OWNER_COOKIE)?.value)) return fail("Not allowed.", 403);
  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Bad request.");
  }
  const key = clean(body.key, 64).replace(/[^a-f0-9]/g, "");
  if (!key) return fail("Missing enquiry.");
  const statuses = (await getJSON("enquiry:statuses")) || {};

  if (body.send) {
    const reportId = clean(body.reportId, 20).replace(/[^A-Za-z0-9_-]/g, "");
    if (!reportId || !(await getJSON(`report:${reportId}`))) return fail("That report has expired. Run a fresh check for their store from your owner account first.", 404);
    const site = process.env.SITE_URL || "https://www.doesaiseemystore.com";
    // A private link that shows this one report in full (for 90 days).
    const token = randomBytes(12).toString("base64url");
    await setJSON(`share:${token}`, reportId, 90 * 24 * 60 * 60);
    const link = `${site}/report/${reportId}?access=${token}`;
    const name = clean(body.name, 80).split(" ")[0] || "there";
    const owner = process.env.NEXT_PUBLIC_OWNER_NAME || "Jake";
    const subject = `Your full AI visibility report for ${clean(body.website, 80) || "your store"}`;
    const text = `Hi ${name},

Thanks for requesting your full report. Here it is:
${link}

It shows every search we tested, who AI recommends instead of you, all your fixes (with ready-to-paste text) and a step-by-step growth plan. You can download it as a PDF from the page.

Full reports are free at the moment while we gather feedback. If you have a minute, I'd really value your honest thoughts, good or bad:
${site}/feedback

Any questions, just reply to this email.

Thanks,
${owner}
DoesAISeeMyStore`;

    statuses[key] = { status: "sent", at: new Date().toISOString(), link };
    await setJSON("enquiry:statuses", statuses, 400 * 24 * 60 * 60);

    // Send it directly if your own domain is set up in Resend; otherwise hand back a ready-written email.
    const resend = process.env.RESEND_API_KEY;
    const from = process.env.NOTIFY_FROM;
    const to = clean(body.email, 120);
    if (resend && from && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], reply_to: process.env.NOTIFY_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || undefined, subject, text }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
      if (res?.ok) return Response.json({ ok: true, sent: true, link });
    }
    return Response.json({ ok: true, sent: false, link, mailto: `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}` });
  }

  const status = STATUSES.includes(body.status) ? body.status : null;
  if (!status) return fail("Unknown status.");
  statuses[key] = { ...(statuses[key] || {}), status, at: new Date().toISOString() };
  await setJSON("enquiry:statuses", statuses, 400 * 24 * 60 * 60);
  return Response.json({ ok: true });
}
