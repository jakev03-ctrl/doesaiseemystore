import { createHash } from "crypto";
import { increment, pushToList } from "../../../lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Visitors' browsers report page crashes here, so they show in the admin page's health panel.
export async function POST(req) {
  try {
    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const ipKey = createHash("sha256").update(ip).digest("hex").slice(0, 32);
    const n = await increment(`limit:clienterr:${ipKey}:${new Date().toISOString().slice(0, 10)}`, 2 * 24 * 60 * 60);
    if (n > 20) return Response.json({ ok: true });
    const b = await req.json().catch(() => ({}));
    const clean = (v, max) => String(v || "").replace(/[<>]/g, "").slice(0, max);
    await pushToList(
      "client-errors",
      { at: new Date().toISOString(), message: clean(b.message, 300), stack: clean(b.stack, 1200), page: clean(b.page, 100), agent: clean(b.agent, 200), digest: clean(b.digest, 40) },
      200
    );
  } catch {}
  return Response.json({ ok: true });
}
