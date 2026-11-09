// Head-to-head: two shops on the SAME shopper searches.
// Worked out from the answers we already have (who AI named, which sites it cited), so it
// costs nothing extra and needs no new AI searches. The other shop's website is read once
// for its name and the same basic checks we run on every store.
import { readShop, normaliseUrl } from "./shop";
import { summariseChecks } from "./checks";

const norm = (s) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");

// Read the other shop. If its site can't be read, we still match it by its web address.
export async function loadOther(url) {
  const { domain } = normaliseUrl(url);
  try {
    const shop = await readShop(url);
    return { domain: shop.domain, name: shop.shopName, checks: shop.checks ? summariseChecks(shop.checks) : null };
  } catch {
    const root = domain.split(".")[0];
    return { domain, name: root.charAt(0).toUpperCase() + root.slice(1), checks: null };
  }
}

// Did AI pick this shop for this question?
export function picked(q, shop) {
  const keys = [norm(shop.name), norm(shop.domain.split(".")[0])].filter((k) => k.length >= 4);
  const byName = (q.picks || []).some((p) => {
    if (p === "@self") return false;
    const n = norm(p);
    return n.length >= 4 && keys.some((k) => n.includes(k) || k.includes(n));
  });
  const byLink = (q.hosts || []).some((h) => h === shop.domain || h.endsWith("." + shop.domain));
  return byName || byLink;
}

const hit = (q) => Object.values(q.results || {}).some((v) => v === true);

// report: the saved report (shop A). other: { domain, name, checks } (shop B).
// youAre: "a" when the report is about your store, "b" when it's about a competitor.
export function computeH2H(report, other, youAre = "a") {
  const qs = (report.questions || []).filter((q) => Array.isArray(q.picks));
  if (!qs.length) return null;
  const aWins = [];
  const bWins = [];
  const both = [];
  let neither = 0;
  for (const q of qs) {
    const a = hit(q);
    const b = picked(q, other);
    if (a && !b) aWins.push(q.question);
    else if (b && !a) bWins.push(q.question);
    else if (a && b) both.push(q.question);
    else neither += 1;
  }
  const rows = [
    ["aiAccess", "Open to AI assistants"],
    ["sitemap", "Sitemap AI can follow"],
    ["productData", "Product data AI can read"],
    ["policies", "Delivery & returns easy to find"],
  ];
  const have = rows.map(([k, label]) => ({
    label,
    a: report.checks?.[k] ? Boolean(report.checks[k].ok) : null,
    b: other.checks?.[k] ? Boolean(other.checks[k].ok) : null,
  }));
  return {
    at: new Date().toISOString(),
    youAre,
    a: { domain: report.shop.domain, name: report.shop.name, found: aWins.length + both.length, checked: qs.length },
    b: { domain: other.domain, name: other.name, found: bWins.length + both.length, checked: qs.length },
    aWins,
    bWins,
    both,
    neither,
    have,
  };
}

// The free report shows the counts and the "why" table; the question lists are in the full report.
export function publicH2H(h, full) {
  if (!h) return null;
  const counts = { aWins: h.aWins.length, bWins: h.bWins.length, both: h.both.length };
  if (full) return { ...h, locked: false, counts };
  return { ...h, locked: true, aWins: h.aWins.slice(0, 1), bWins: h.bWins.slice(0, 1), both: h.both.slice(0, 1), counts };
}
