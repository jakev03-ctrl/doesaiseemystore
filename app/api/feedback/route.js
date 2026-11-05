import { createHash } from "crypto";
import { increment, pushToList, trimOlderThan } from "../../../lib/store";
import { notifyOwner } from "../../../lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PER_DAY = 5;
const fail = (error, status = 400) => Response.json({ error }, { status });
const clean = (v, max) => String(v || "").trim().slice(0, max);

// Saves "How did we do?" feedback to the admin page and emails you.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Something went wrong. Please try again.");
  }
  if (body.company_site) return Response.json({ ok: true }); // bots fill the hidden box

  const entry = {
    type: "feedback",
    stars: Math.max(1, Math.min(5, Math.round(Number(body.stars) || 0))),
    message: clean(body.message, 2000),
    name: clean(body.name, 80),
    business: clean(body.business, 80),
    email: clean(body.email, 120),
    canShare: body.canShare === true,
    incentive: "Received a free full report",
  };
  if (entry.message.length < 3) return fail("Please tell us a little about what you thought.");
  if (entry.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(entry.email)) return fail("Please check your email address.");

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const ipKey = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const day = new Date().toISOString().slice(0, 10);

  try {
    const n = await increment(`limit:feedback:${ipKey}:${day}`, 2 * 24 * 60 * 60);
    if (n > PER_DAY) return fail("Thanks! You've already sent feedback today.", 429);
    await pushToList("feedback", { at: new Date().toISOString(), ...entry }, 1000);
    await notifyOwner(entry);
    await trimOlderThan("feedback", Number(process.env.INBOX_DAYS || 365) * 2).catch(() => {});
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Feedback failed:", e);
    return fail("We couldn't send that right now. Please try again in a minute.", 500);
  }
}
