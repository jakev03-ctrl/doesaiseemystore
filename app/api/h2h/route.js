// "Compare head-to-head" from a report: how a rival does on the SAME searches.
// No new AI searches are run (it uses the answers we already have), so it doesn't use a free check.
import { NextResponse } from "next/server";
import { getJSON, setJSON, increment } from "../../../lib/store";
import { normaliseUrl } from "../../../lib/shop";
import { loadOther, computeH2H, publicH2H } from "../../../lib/h2h";
import { DEVICE_COOKIE, OWNER_COOKIE, isOwner, hash } from "../../../lib/limits";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const PER_DAY = Number(process.env.H2H_PER_DAY || 15);

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong with the request. Please try again." }, { status: 400 });
  }
  const id = String(body.reportId || "");
  if (!/^[A-Za-z0-9_-]{4,20}$/.test(id)) return NextResponse.json({ error: "We couldn't find that report." }, { status: 404 });
  const report = await getJSON(`report:${id}`).catch(() => null);
  if (!report) return NextResponse.json({ error: "This report has expired. Please run a new check." }, { status: 404 });
  if (!(report.questions || []).some((q) => Array.isArray(q.picks))) {
    return NextResponse.json({ error: "This report is from before head-to-head comparisons. Run a new check to compare." }, { status: 400 });
  }

  let domain;
  try {
    domain = normaliseUrl(String(body.rival || "").slice(0, 300)).domain;
  } catch {
    return NextResponse.json({ error: "Please check the web address, it doesn't look right." }, { status: 400 });
  }
  if (domain === report.shop.domain) return NextResponse.json({ error: "That's the same store. Enter a different one." }, { status: 400 });

  // Full lists for the owner, or a client with their private link. Everyone else gets the free version.
  const owner = isOwner(req.cookies.get(OWNER_COOKIE)?.value);
  const access = String(body.access || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  const client = !owner && access ? (await getJSON(`share:${access}`).catch(() => null)) === id : false;
  const full = owner || client;

  // youAre: "a" when the report is about your store; "b" when it's a competitor's report and you're adding yours.
  const youAre = report.subject === "them" ? "b" : "a";
  const cacheKey = `h2h:${id}:${domain}`;
  let h = await getJSON(cacheKey).catch(() => null);
  if (!h) {
    if (!owner) {
      const who = req.cookies.get(DEVICE_COOKIE)?.value || (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
      const used = await increment(`limit:h2h:${hash(who)}:${new Date().toISOString().slice(0, 10)}`, 2 * 24 * 60 * 60);
      if (used > PER_DAY) return NextResponse.json({ error: "That's a lot of comparisons for one day. Please come back tomorrow." }, { status: 429 });
    }
    const other = await loadOther(domain);
    h = computeH2H(report, other, youAre);
    if (!h) return NextResponse.json({ error: "We couldn't compare these stores. Please try again." }, { status: 500 });
    await setJSON(cacheKey, h, 24 * 60 * 60).catch(() => {});
  }
  return NextResponse.json({ h2h: publicH2H(h, full) });
}
