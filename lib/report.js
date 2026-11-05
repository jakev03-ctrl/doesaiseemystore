// What visitors see. The full results stay private on the server.
//  - Free report: company, score, and the first 2 points of each section (well, wrong, stats, fixes).
//    Everything else is only counted (so the blurred rows can't be "un-blurred").
//  - Full report (owner, or when we send it to a client): everything.
// The stats are worked out here from the real results, never by the AI, so they're always true.
const hit = (q) => Object.values(q.results || {}).some((v) => v === true);

function shorten(text, maxWords = 25) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ").replace(/[,;:\-–]+$/, "") + "…";
}

const quote = (q, max = 12) => `“${shorten(q, max).replace(/[?.!]+$/, "")}”`;

function times(a, b) {
  const r = a / b;
  return Number.isInteger(r) ? `${r}×` : `${r.toFixed(1)}×`;
}

// "What you're doing well" and "What you're doing wrong".
export function buildPoints(report) {
  const qs = report.questions || [];
  const wins = qs.filter(hit).sort((a, b) => (a.position || 99) - (b.position || 99));
  const missed = qs.filter((q) => !hit(q));
  const checked = report.checked || qs.length;
  const found = typeof report.found === "number" ? report.found : wins.length;
  const top = (report.competitors || [])[0];
  const checks = report.checks || {};

  const well = [];
  for (const q of wins.slice(0, 2)) {
    well.push(q.position === 1 ? `AI picked you first when shoppers asked ${quote(q.question)}.` : `AI recommended you when shoppers asked ${quote(q.question)}.`);
  }
  if (checks.aiAccess?.ok) well.push("AI assistants can read your store: nothing is blocking them.");
  for (const g of report.good || report.highlights || []) well.push(shorten(g));

  const wrong = [];
  if (checks.aiAccess && !checks.aiAccess.ok) wrong.push(`${checks.aiAccess.text}, so AI may not be able to recommend you.`);
  if (missed.length && checked) {
    wrong.push(`You didn't come up in ${missed.length} of ${checked} shopper searches, such as ${quote(missed[0].question)}.`);
  }
  if (top && top.count > found) {
    wrong.push(found > 0 ? `${top.name} was recommended in ${top.count} searches. You were recommended in ${found}.` : `${top.name} was recommended in ${top.count} searches. You weren't recommended in any.`);
  }
  for (const b of report.bad || []) wrong.push(shorten(b));

  return { well: well.map((x) => shorten(x)).slice(0, 5), wrong: wrong.map((x) => shorten(x)).slice(0, 5) };
}

// The eye-catching numbers, most striking first.
export function buildStats(report) {
  const checked = report.checked || (report.questions || []).length;
  const found = typeof report.found === "number" ? report.found : 0;
  const top = (report.competitors || [])[0];
  const others = typeof report.shopsSeen === "number" ? report.shopsSeen : (report.competitors || []).length;
  const stats = [];

  if (checked && found < checked) {
    stats.push({ big: `${checked - found} out of ${checked}`, text: "shopper searches where AI recommended someone else instead of you.", hot: true });
  }
  if (top) {
    if (found === 0) stats.push({ big: String(top.count), text: `searches where AI recommended ${top.name}. You weren't mentioned in any.`, hot: true });
    else if (top.count > found) stats.push({ big: times(top.count, found), text: `${top.name} is recommended ${times(top.count, found)} as often as you.`, hot: true });
    else stats.push({ big: "No. 1", text: "No competitor was recommended more often than you. Let's keep it that way." });
  }
  if (others > 0) stats.push({ big: `${others} ${others === 1 ? "shop" : "shops"}`, text: `${others === 1 ? "other shop" : "other shops"} AI recommended for ${shorten(report.category, 6)}.` });
  if (report.topPicks > 0) stats.push({ big: String(report.topPicks), text: `${report.topPicks === 1 ? "search" : "searches"} where AI named you as its first choice.` });
  return stats.slice(0, 3);
}

export function publicView(report, { full = false } = {}) {
  const qs = report.questions || [];
  const checked = report.checked || qs.length;
  const found = typeof report.found === "number" ? report.found : qs.filter(hit).length;
  const points = buildPoints(report);
  const stats = buildStats(report);
  const fixes = report.fixes || [];

  const base = {
    id: report.id,
    createdAt: report.createdAt,
    shop: report.shop,
    category: report.category,
    location: report.location || "",
    extra: report.extra || "",
    market: report.market?.label || report.location || "",
    overall: report.overall,
    visibility: report.visibility,
    label: report.label,
    found,
    checked,
    previous: report.previous || null,
    history: (report.history || []).filter((h) => typeof h.overall === "number"),
  };

  if (!full) {
    // Free report: the first 2 of each section. The rest is only counted (and shown blurred).
    const FREE = 2;
    return {
      ...base,
      locked: true,
      well: points.well.slice(0, FREE),
      wrong: points.wrong.slice(0, FREE),
      stats: stats.slice(0, FREE),
      fixes: fixes.slice(0, FREE),
      hidden: {
        well: Math.max(1, points.well.length - FREE),
        wrong: Math.max(1, points.wrong.length - FREE),
        stats: Math.max(1, stats.length - FREE),
        fixes: Math.max(2, fixes.length - FREE),
      },
    };
  }

  return {
    ...base,
    locked: false,
    summary: report.summary,
    dataScore: report.dataScore,
    well: points.well,
    wrong: points.wrong,
    stats,
    fixes,
    topPicks: report.topPicks ?? null,
    rank: report.rank || null,
    youMentions: found,
    competitors: report.competitors || [],
    categories: report.categories || [],
    checks: report.checks || null,
    plan: report.plan || [],
    snippets: report.snippets || [],
    allSearches: qs.map((q) => ({ question: q.question, category: q.category || "", found: hit(q), position: q.position || null })),
    hidden: {},
  };
}

// A small public summary used on the compare page.
export function compareView(report) {
  const stats = buildStats(report);
  return {
    id: report.id,
    shop: report.shop,
    overall: report.overall,
    label: report.label,
    visibility: report.visibility,
    found: report.found ?? 0,
    checked: report.checked ?? 0,
    topPicks: report.topPicks ?? 0,
    category: report.category,
    stat: stats[0] || null,
  };
}
