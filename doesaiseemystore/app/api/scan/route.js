import { NextResponse } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { readShop, normaliseUrl } from "../../../lib/shop";
import { auditShop, testVisibility, label } from "../../../lib/analyse";
import { getJSON, setJSON } from "../../../lib/store";
import { publicView } from "../../../lib/report";
import { countEvent, logScan } from "../../../lib/stats";
import { DEVICE_COOKIE, OWNER_COOKIE, isOwner, checkLimit, recordScan } from "../../../lib/limits";

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

export async function POST(req) {
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

  if (!owner && !(await passesBotCheck(body.botToken, ip))) {
    return fail("Please complete the quick 'are you human?' check, then try again.", 403);
  }

  try {
    // Work out the shop's address first, so we can reuse a recent result.
    const { domain } = normaliseUrl(url);
    const cacheKey = `cache:${domain}:${slug(category)}:${slug(extra)}`;

    // Reuse a result from the last day (free, and doesn't use up a scan). Owners always get a fresh scan.
    if (!owner) {
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

    const shop = await readShop(url);
    const audit = await auditShop(shop, category, extra);
    const vis = await testVisibility(shop, audit.questions);

    if (vis.checked === 0) {
      return fail("Our AI checks didn't complete this time. Please try again in a minute.", 503);
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

    const report = {
      id,
      createdAt: new Date().toISOString(),
      shop: { name: shop.shopName, domain: shop.domain, platform: shop.platform, productsRead: shop.products.length },
      category,
      extra,
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
      fixes: audit.fixes,
      previous,
    };

    await setJSON(`report:${id}`, report, REPORT_DAYS * 24 * 60 * 60);
    await setJSON(cacheKey, id, CACHE_HOURS * 60 * 60);
    await setJSON(latestKey, id, REPORT_DAYS * 24 * 60 * 60);
    const remaining = await recordScan({ deviceId, ip, owner });

    console.log("SCAN", JSON.stringify({ id, domain: shop.domain, category, extra, overall, visibility, owner }));
    await countEvent(owner ? "ownerScans" : "scans");
    await logScan({ id, domain: shop.domain, name: shop.shopName, platform: shop.platform, category, extra, overall, visibility, owner, cached: false });

    return reply({ ...publicView(report), remaining }, 200, deviceId, newDevice);
  } catch (e) {
    console.error("Scan failed:", e);
    await countEvent("errors");
    await logScan({ domain: url.slice(0, 80), category, extra, owner, error: String(e?.message || "error").slice(0, 160) });
    const msg =
      e?.message && !/api|key|anthropic|openai|json|redis|upstash/i.test(e.message)
        ? e.message
        : "Something went wrong while scanning. Please try again in a minute.";
    return fail(msg, 500);
  }
}
