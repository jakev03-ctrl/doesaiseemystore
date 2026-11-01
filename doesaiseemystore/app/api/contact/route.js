import { createHash } from "crypto";
import { increment, pushToList } from "../../../lib/store";
import { countEvent } from "../../../lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PER_DAY = 5;

function fail(error, status = 400) {
  return Response.json({ error }, { status });
}

const clean = (v, max) => String(v || "").trim().slice(0, max);

// Handles both the contact page and in-depth report requests.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Something went wrong. Please try again.");
  }

  // Hidden "company_site" field: real people never fill it in, spam bots usually do.
  if (body.company_site) return Response.json({ ok: true });

  const isReport = body.type === "report";
  const email = clean(body.email, 120);
  const message = clean(body.message, 3000);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Please enter a valid email address so we can reply.");

  let entry;
  if (isReport) {
    const business = clean(body.business, 100);
    const website = clean(body.website, 200);
    if (business.length < 2) return fail("Please enter your business name.");
    if (website.length < 4) return fail("Please enter your website.");
    if (message.length < 5) return fail("Please tell us a little about what you do.");
    entry = {
      type: "report",
      business,
      website,
      email,
      message,
      reportId: /^[A-Za-z0-9_-]{4,20}$/.test(String(body.reportId || "")) ? body.reportId : null,
    };
  } else {
    if (message.length < 5) return fail("Please write a short message.");
    entry = { type: "message", name: clean(body.name, 80), email, message };
  }

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const ipKey = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const day = new Date().toISOString().slice(0, 10);

  try {
    const n = await increment(`limit:contact:${ipKey}:${day}`, 2 * 24 * 60 * 60);
    if (n > PER_DAY) return fail("You've sent a few messages today. We'll get back to you soon!", 429);

    await pushToList("inbox", { at: new Date().toISOString(), ...entry }, 1000);
    if (isReport) await countEvent("requests");
    else await increment("stats:messages:all", 3650 * 24 * 60 * 60);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Contact failed:", e);
    return fail("We couldn't send that right now. Please try again in a minute.", 500);
  }
}
