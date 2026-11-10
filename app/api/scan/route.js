import { NextResponse, after } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { readShop, normaliseUrl } from "../../../lib/shop";
import { auditShop, testVisibility, label, newCost } from "../../../lib/analyse";
import { getJSON, setJSON } from "../../../lib/store";
import { publicView } from "../../../lib/report";
import { countEvent, logScan, errorType } from "../../../lib/stats";
import { DEVICE_COOKIE, OWNER_COOKIE, isOwner, checkLimit, recordScan, hash } from "../../../lib/limits";
import { alertOnFailures } from "../../../lib/alerts";
import { summariseChecks } from "../../../lib/checks";
import { loadOther, computeH2H } from "../../../lib/h2h";

export const runtime = "nodejs";
export const maxDuration = 180; // seconds (free Vercel plan allows up to 300)
export const dynamic = "force-dynamic";

const REPORT_DAYS = Number(process.env.REPORT_DAYS || 90);
const CACHE_HOURS = Number(process.env.CACHE_HOURS || 24);

// The owner's own shopper questions (up to 3). Only shopping questions, nothing else.
function cleanQuestions(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const raw of list.slice(0, 3)) {
    const q = String(raw || "").replace(/[<>{}\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
    if (q.length < 6) continue;
    if (/https?:|www\.|ignore (all|any|previous|the above)|system prompt|instruction|you are an? /i.test(q)) {
      const err = new Error("Your own questions can only be about shopping for what you sell. Please change them and try again.");
      err.userFacing = true;
      throw err;
    }
    if (!out.some((x) => x.toLowerCase() === q.toLowerCase())) out.push(q);
  }
  return out;
}

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
  if (job.status === "error") {
    // The owner sees the real reason (e.g. "Out of API credit"), visitors see a friendly message.
    const owner = isOwner(req.cookies.get(OWNER_COOKIE)?.value);
    const code = job.detail ? ` (Reason: ${job.detail.split(":")[0]})` : "";
    return NextResponse.json({ status: "error", error: owner && job.detail ? `${job.error} (Owner only: ${job.detail})` : `${job.error}${code}` });
  }
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
  const mode = body.mode === "rival" ? "rival" : "mine"; // checking a competitor's store
  let customs;
  try {
    customs = cleanQuestions(body.questions);
  } catch (e) {
    return fail(e.message);
  }
  const compareRaw = String(body.compareTo || "").trim().slice(0, 300);

  if (!owner && !(await passesBotCheck(body.botToken, ip))) {
    return fail("Please complete the quick 'are you human?' check, then try again.", 403);
  }

  try {
    // Work out the shop's address first, so we can reuse a recent result.
    const { domain } = normaliseUrl(url);
    let compareTo = "";
    if (compareRaw) {
      try {
        compareTo = normaliseUrl(compareRaw).domain;
      } catch {
        return fail("Please check the second web address, it doesn't look right.");
      }
      if (compareTo === domain) compareTo = "";
    }
    const variant = mode === "rival" || customs.length || compareTo ? `:${mode}:${hash(customs.join("|") + "|" + compareTo).slice(0, 10)}` : "";
    const cacheKey = `cache:${domain}:${slug(category)}:${slug(location)}:${slug(extra)}${variant}`;

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
    await setJSON(lockKey, { at: Date.now() }, 200);

    const jobId = randomBytes(9).toString("base64url");
    await setJSON(`job:${jobId}`, { status: "running", startedAt: Date.now() }, 60 * 60);

    async function work() {
  const cost = newCost();
  const shop = await readShop(url);
  const baseCount = Number(process.env.QUESTION_COUNT || 10);
  const audit = await auditShop(shop, category, extra, location, cost, { count: Math.max(7, baseCount - customs.length), rival: mode === "rival" });
  const questions = [...audit.questions, ...customs.map((q) => ({ question: q, category: "Your question", mine: true }))];
  const vis = await testVisibility(shop, questions, audit.market, cost);
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
    subject: mode === "rival" ? "them" : "you",
    customs,
    compareTo: compareTo || null,
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
    fixDetails: audit.fixDetails,
    nextSteps: audit.nextSteps,
    plan: audit.plan,
    checks: shop.checks ? summariseChecks(shop.checks) : null,
    costUsd,
    previous,
    history: [...history, { at: new Date().toISOString(), overall: null }].slice(-12),
  };
  report.history[report.history.length - 1].overall = overall;

  // Head-to-head on the same searches (no extra AI cost): your store vs theirs.
  if (compareTo) {
    try {
      const other = await loadOther(compareTo);
      report.h2h = computeH2H(report, other, mode === "rival" ? "b" : "a");
    } catch (e) {
      console.error("Head-to-head failed:", e?.message);
    }
  }

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
        const raw = String(e?.message || "");
        const msg = /credit|billing|balance|quota/i.test(raw)
          ? "Our checks are taking a short break right now. Please try again a little later. This didn't use up one of your free checks."
          : /rate.?limit|429|overloaded|529|too many/i.test(raw)
            ? "Lots of people are checking their stores right now. Please try again in a minute. This didn't use up one of your free checks."
            : raw && !/api|key|anthropic|openai|json|redis|upstash/i.test(raw)
              ? `${raw} This didn't use up one of your free checks.`
              : "Something went wrong while scanning. Please try again in a minute. This didn't use up one of your free checks.";
        await setJSON(`job:${jobId}`, { status: "error", error: msg, detail: `${kind.type}: ${raw.slice(0, 200)}` }, 60 * 60);
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
