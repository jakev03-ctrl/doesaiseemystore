import { NextResponse, after } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { readShop, normaliseUrl } from "../../../lib/shop";
import { auditShop, testVisibility, label, newCost } from "../../../lib/analyse";
import { getJSON, setJSON } from "../../../lib/store";
import { publicView } from "../../../lib/report";
import { countEvent, logScan, errorType } from "../../../lib/stats";
import { DEVICE_COOKIE, OWNER_COOKIE, isOwner, checkLimit, recordScan, hash } from "../../../lib/limits";
import { alertOnFailures } from "../../../lib/alerts";

export const runtime = "nodejs";
export const maxDuration = 180; // seconds (free Vercel plan allows up to 300)
export const dynamic = "force-dynamic";

const REPORT_DAYS = Number(process.env.REPORT_DAYS || 90);
const CACHE_HOURS = Number(process.env.CACHE_HOURS || 24);

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function reply(body, status, deviceId, newDevice) {
  const res = NextResponse.json(body, { status });
  if (newDevice) {
    res.cookies.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

// Optional bot check (Cloudflare Turnstile). Only active if its keys are set.
async function passesBotCheck(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

// The simple "What we checked" facts shown on the report.
function summariseChecks(c) {
  const f = c.productSchema && typeof c.productSchema === "object" ? c.productSchema : null;
  const label = { reviews: "reviews", image: "images", description: "descriptions", price: "prices", availability: "stock", brand: "brand", identifier: "product codes", shipping: "delivery info", returns: "returns info" };
  const missing = f ? Object.keys(label).filter((k) => f[k] === false).map((k) => label[k]) : [];
  return {
    aiAccess: c.blockedBots.length ? { ok: false, text: `Blocked for ${c.blockedBots.join(", ")}` } : c.blockedProducts.length ? { ok: false, text: `Product pages blocked for ${c.blockedProducts.join(", ")}` } : { ok: true, text: "Open to AI assistants" },
    sitemap: c.sitemap.found ? { ok: true, text: c.sitemap.products ? "Found, lists your products" : "Found" } : { ok: false, text: "Not found" },
    productData:
      c.productSchema === "none" ? { ok: false, text: "Not found on product pages" }
      : c.productSchema === "microdata" ? { ok: true, text: "Found" }
      : f ? { ok: missing.length <= 2, text: missing.length ? `Found, missing ${missing.slice(0, 3).join(", ")}` : "Found, complete" }
      : null,
    policies: { ok: c.policies.returns && c.policies.delivery, text: c.policies.returns && c.policies.delivery ? "Delivery and returns linked" : !c.policies.returns && !c.policies.delivery ? "Delivery and returns not linked from homepage" : !c.policies.returns ? "Returns not linked from homepage" : "Delivery not linked from homepage" },
  };
}

// Is a background check finished yet? (The browser asks every couple of seconds.)
async function jobStatus(req, jobId) {
  const job = await getJSON(`job:${jobId}`).catch(() => null);
  if (!job) return NextResponse.json({ status: "missing", error: "We couldn't find that check. Please run it again." }, { status: 404 });
  if (job.status === "done") {
    const report = await getJSON(`report:${job.reportId}`);
    if (!report) return NextResponse.json({ status: "error", error: "Your report has expired. Please run the check again." }, { status: 404 });
    const owner = isOwner(req.cookies.get(OWNER_COOKIE)?.value);
    return NextResponse.json({ status: "done", report: { ...publicView(report, { full: owner }), remaining: job.remaining } });
  }
  if (job.status === "error") return NextResponse.json({ status: "error", error: job.error });
  return NextResponse.json({ status: "running", elapsed: Date.now() - job.startedAt });
}

// How many free checks this visitor has left today (shown under the form).
export async function GET(req) {
  const jobId = new URL(req.url).searchParams.get("job");
  if (jobId) return jobStatus(req, jobId.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 20));
  const existingDevice = req.cookies.get(DEVICE_COOKIE)?.value;
  const deviceId = existingDevice && existingDevice.length < 80 ? existingDevice : randomUUID();
  const owner = isOwner(req.cookies.get(OWNER_COOKIE)?.value);
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  try {
    const limit = await checkLimit({ deviceId, ip, owner });
    return reply({ remaining: limit.remaining, limit: limit.limit, owner }, 200, deviceId, deviceId !== existingDevice);
  } catch {
    return reply({ remaining: null }, 200, deviceId, deviceId !== existingDevice);
  }
}

export async function POST(req) {
  const started = Date.now();
  // Who is this?
  const existingDevice = req.cookies.get(DEVICE_COOKIE)?.value;
  const deviceId = existingDevice && existingDevice.length < 80 ? existingDevice : randomUUID();
  const newDevice = deviceId !== existingDevice;
  const owner = isOwner(req.cookies.get(OWNER_COOKIE)?.value);
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const fail = (message, status = 400) => reply({ error: message }, status, deviceId, newDevice);

  if (!process.env.ANTHROPIC_API_KEY) return fail("The site isn't set up yet: the AI key is missing.", 500);

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Something went wrong with the request. Please try again.");
  }

  const url = String(body.url || "").slice(0, 300);
  const category = String(body.category || "").trim().slice(0, 80);
  if (category.length < 2) return fail("Please tell us what you sell (e.g. scented candles).");
  const extra = String(body.extra || "").trim().slice(0, 120);
  const location = String(body.location || "").trim().slice(0, 60);
  const fresh = body.fresh === true; // "Check again": skip the saved result from earlier today

  if (!owner && !(await passesBotCheck(body.botToken, ip))) {
    return fail("Please complete the quick 'are you human?' check, then try again.", 403);
  }

  try {
    // Work out the shop's address first, so we can reuse a recent result.
    const { domain } = normaliseUrl(url);
    const cacheKey = `cache:${domain}:${slug(category)}:${slug(location)}:${slug(extra)}`;

    // Reuse a result from the last day (free, and doesn't use up a scan). Owners always get a fresh scan.
    if (!owner && !fresh) {
      const cachedId = await getJSON(cacheKey);
      const cached = cachedId ? await getJSON(`report:${cachedId}`) : null;
      if (cached) {
        const limit = await checkLimit({ deviceId, ip, owner });
        await countEvent("cached");
        await logScan({ id: cached.id, domain: cached.shop.domain, name: cached.shop.name, category, extra, overall: cached.overall, visibility: cached.visibility, owner, cached: true });
        return reply({ ...publicView(cached), cached: true, remaining: limit.remaining }, 200, deviceId, newDevice);
      }
    }

    const limit = await checkLimit({ deviceId, ip, owner });
    if (!limit.ok) {
      await countEvent("limited");
      return fail(
        `You've used your ${limit.limit} free ${limit.limit === 1 ? "scan" : "scans"} for today. Come back tomorrow!`,
        429
      );
    }

    // A check can take a while, so it runs in the background: the visitor can leave and come back.
    const lockKey = `running:${hash(deviceId)}`;
    if (!owner) {
      const running = await getJSON(lockKey);
      if (running) return fail("A check is already running for you. It'll be ready in a moment.", 429);
    }
    await setJSON(lockKey, { at: Date.now() }, 240);

    const jobId = randomBytes(9).toString("base64url");
    await setJSON(`job:${jobId}`, { status: "running", startedAt: Date.now() }, 60 * 60);

    async function work() {
  const cost = newCost();
  const shop = await readShop(url);
  const audit = await auditShop(shop, category, extra, location, cost);
  const vis = await testVisibility(shop, audit.questions, audit.market, cost);
  const costUsd = Math.round(cost.usd * 1000) / 1000;

  if (vis.checked === 0) {
    await countEvent("errors");
    await logScan({ domain: shop.domain, category, extra, owner, ms: Date.now() - started, error: "AI checks didn't complete", errorType: "AI searches failed", system: true, cost: costUsd });
    const err = new Error("Our AI checks didn't complete this time. Please try again in a minute.");
    err.logged = true;
    throw err;
  }

  const visibility = Math.round((vis.found / vis.checked) * 100);
  const overall = Math.round(visibility * 0.6 + audit.dataScore * 0.4);
  const id = randomBytes(6).toString("base64url");

  // Before and after: compare with the last check of this store for the same category.
  const latestKey = `latest:${shop.domain}:${slug(category)}`;
  let previous = null;
  try {
    const prevId = await getJSON(latestKey);
    const prev = prevId ? await getJSON(`report:${prevId}`) : null;
    if (prev) previous = { id: prev.id, overall: prev.overall, visibility: prev.visibility, dataScore: prev.dataScore, createdAt: prev.createdAt };
  } catch {}

  // Score history for this store (last 12 checks), for the "score over time" chart.
  const historyKey = `history:${shop.domain}:${slug(category)}`;
  let history = [];
  try {
    history = (await getJSON(historyKey)) || [];
  } catch {}

  const report = {
    id,
    createdAt: new Date().toISOString(),
    shop: { name: shop.shopName, domain: shop.domain, platform: shop.platform, productsRead: shop.products.length },
    category,
    extra,
    location,
    market: audit.market,
    topPicks: vis.topPicks,
    rank: vis.rank,
    categories: vis.categories,
    overall,
    visibility,
    label: label(visibility),
    found: vis.found,
    checked: vis.checked,
    ais: vis.ais,
    questions: vis.questions,
    competitors: vis.competitors,
    dataScore: audit.dataScore,
    summary: audit.summary,
    highlights: audit.highlights || [],
    good: audit.good,
    bad: audit.bad,
    snippets: audit.snippets,
    shopsSeen: vis.shopsSeen,
    fixes: audit.fixes,
    plan: audit.plan,
    checks: shop.checks ? summariseChecks(shop.checks) : null,
    costUsd,
    previous,
    history: [...history, { at: new Date().toISOString(), overall: null }].slice(-12),
  };
  report.history[report.history.length - 1].overall = overall;

  await setJSON(`report:${id}`, report, REPORT_DAYS * 24 * 60 * 60);
  await setJSON(cacheKey, id, CACHE_HOURS * 60 * 60);
  await setJSON(latestKey, id, REPORT_DAYS * 24 * 60 * 60);
  await setJSON(historyKey, report.history, 365 * 24 * 60 * 60).catch(() => {});
  const remaining = await recordScan({ deviceId, ip, owner });

  console.log("SCAN", JSON.stringify({ id, domain: shop.domain, category, extra, overall, visibility, owner }));
  await countEvent(owner ? "ownerScans" : "scans");
  await logScan({ id, domain: shop.domain, name: shop.shopName, platform: shop.platform, category, extra: [location, extra].filter(Boolean).join(" · "), overall, visibility, owner, cached: false, ms: Date.now() - started, cost: costUsd });

  return { report, remaining };
    }

    after(async () => {
      try {
        const { report, remaining } = await work();
        await setJSON(`job:${jobId}`, { status: "done", reportId: report.id, remaining }, 60 * 60);
      } catch (e) {
        console.error("Scan failed:", e);
        const kind = errorType(e?.message);
        if (!e?.logged) {
          await countEvent("errors");
          await logScan({ domain: url.slice(0, 80), category, extra, owner, ms: Date.now() - started, error: String(e?.message || "error").slice(0, 160), errorType: kind.type, system: kind.system });
        }
        if (kind.system) await alertOnFailures(e?.message).catch(() => {});
        const msg =
          e?.message && !/api|key|anthropic|openai|json|redis|upstash|credit|rate/i.test(e.message)
            ? e.message
            : "Something went wrong while scanning. Please try again in a minute.";
        await setJSON(`job:${jobId}`, { status: "error", error: msg }, 60 * 60);
      } finally {
        await setJSON(lockKey, 0, 1).catch(() => {});
      }
    });

    return reply({ job: jobId, status: "running" }, 202, deviceId, newDevice);
  } catch (e) {
    console.error("Scan failed:", e);
    await countEvent("errors");
    const kind = errorType(e?.message);
    await logScan({ domain: url.slice(0, 80), category, extra, owner, ms: Date.now() - started, error: String(e?.message || "error").slice(0, 160), errorType: kind.type, system: kind.system });
    const msg =
      e?.message && !/api|key|anthropic|openai|json|redis|upstash/i.test(e.message)
        ? e.message
        : "Something went wrong while scanning. Please try again in a minute.";
    return fail(msg, 500);
  }
}
