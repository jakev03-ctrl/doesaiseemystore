import { readShop } from "../../../lib/shop";
import { auditShop, testVisibility, label } from "../../../lib/analyse";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds
export const dynamic = "force-dynamic";

// Simple limit: 3 scans per visitor per day. (Resets if the server restarts;
// good enough for a first version. Your Anthropic spending cap is the real safety net.)
const LIMIT = Number(process.env.SCANS_PER_DAY || 3);
const seen = new Map();

function allowed(ip) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const times = (seen.get(ip) || []).filter((t) => now - t < day);
  if (times.length >= LIMIT) return false;
  times.push(now);
  seen.set(ip, times);
  return true;
}

function fail(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail("The site isn't set up yet: the AI key is missing.", 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Something went wrong with the request. Please try again.");
  }

  const url = String(body.url || "").slice(0, 300);
  const category = String(body.category || "").trim().slice(0, 80);
  if (category.length < 2) return fail("Please tell us what you sell (e.g. handmade candles).");

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (!allowed(ip)) {
    return fail("You've used your free scans for today. Come back tomorrow!", 429);
  }

  try {
    const shop = await readShop(url);
    const audit = await auditShop(shop, category);
    const { results, competitors } = await testVisibility(shop, audit.questions);

    const checked = results.filter((r) => r.ok);
    if (checked.length === 0) {
      return fail("Our AI checks didn't complete this time. Please try again in a minute.", 503);
    }
    const appeared = checked.filter((r) => r.found).length;
    const visibility = Math.round((appeared / checked.length) * 100);
    const overall = Math.round(visibility * 0.6 + audit.dataScore * 0.4);

    console.log("SCAN", JSON.stringify({ domain: shop.domain, category, overall, visibility, data: audit.dataScore }));

    return Response.json({
      shop: { name: shop.shopName, domain: shop.domain, productsRead: shop.products.length },
      overall,
      visibility,
      label: label(visibility),
      appeared,
      total: checked.length,
      questions: results.map((r) => ({ question: r.question, found: r.found, ok: r.ok })),
      competitors,
      dataScore: audit.dataScore,
      summary: audit.summary,
      fixes: audit.fixes,
    });
  } catch (e) {
    console.error("Scan failed:", e);
    const msg = e?.message && !/api|key|anthropic|json/i.test(e.message)
      ? e.message
      : "Something went wrong while scanning. Please try again in a minute.";
    return fail(msg, 500);
  }
}
