// What visitors see. The full results stay private on the server.
//  - Free report: company, score, and the first 2 points of each section (well, wrong, stats, fixes).
//    Everything else is only counted (so the blurred rows can't be "un-blurred").
//  - Full report (owner, or when we send it to a client): everything.
// The stats are worked out here from the real results, never by the AI, so they're always true.
import { publicH2H } from "./h2h";

const hit = (q) => Object.values(q.results || {}).some((v) => v === true);

// Wording for a report about your store, or about a competitor's ("they").
const WORDS = {
  you: { you: "you", You: "You", were: "You were", your: "your" },
  them: { you: "them", You: "They", were: "They were", your: "their" },
};
const words = (report) => WORDS[report.subject === "them" ? "them" : "you"];

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
  const w = words(report);

  const well = [];
  for (const q of wins.slice(0, 2)) {
    well.push(q.position === 1 ? `AI picked ${w.you} first when shoppers asked ${quote(q.question)}.` : `AI recommended ${w.you} when shoppers asked ${quote(q.question)}.`);
  }
  if (checks.aiAccess?.ok) well.push(`AI assistants can read ${w.your} store: nothing is blocking them.`);
  for (const g of report.good || report.highlights || []) well.push(shorten(g));

  const wrong = [];
  if (checks.aiAccess && !checks.aiAccess.ok) wrong.push(`${checks.aiAccess.text}, so AI may not be able to recommend you.`);
  if (missed.length && checked) {
    wrong.push(`${w.You} didn't come up in ${missed.length} of ${checked} shopper searches, such as ${quote(missed[0].question)}.`);
  }
  if (top && top.count > found) {
    wrong.push(found > 0 ? `${top.name} was recommended in ${top.count} searches. ${w.were} recommended in ${found}.` : `${top.name} was recommended in ${top.count} searches. ${w.were === "You were" ? "You weren't" : "They weren't"} recommended in any.`);
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
  const w = words(report);

  if (checked && found < checked) {
    stats.push({ big: `${checked - found} out of ${checked}`, text: `shopper searches where AI recommended someone else instead of ${w.you}.`, hot: true });
  }
  if (top) {
    if (found === 0) stats.push({ big: String(top.count), text: `searches where AI recommended ${top.name}. ${w.You} weren't mentioned in any.`, hot: true });
    else if (top.count > found) stats.push({ big: times(top.count, found), text: `${top.name} is recommended ${times(top.count, found)} as often as ${w.you}.`, hot: true });
    else stats.push({ big: "No. 1", text: "No competitor was recommended more often than you. Let's keep it that way." });
  }
  if (others > 0) stats.push({ big: `${others} ${others === 1 ? "store" : "stores"}`, text: `${others === 1 ? "other store" : "other stores"} AI recommended for ${shorten(report.category, 6)}.` });
  if (report.topPicks > 0) stats.push({ big: String(report.topPicks), text: `${report.topPicks === 1 ? "search" : "searches"} where AI named ${w.you} as its first choice.` });
  return stats.slice(0, 3);
}

// How much there is to gain on each question, worked out from what we saw (not a guess).
function opportunity(q) {
  if (q.position === 1) return "hold";
  if (hit(q)) return "med";
  const others = (q.picks || []).filter((p) => p !== "@self").length;
  return q.mine || others >= 2 ? "high" : "med";
}

function searchRow(q) {
  return { question: q.question, category: q.category || "", mine: Boolean(q.mine), found: hit(q), position: q.position || null, picks: Array.isArray(q.picks) ? q.picks.slice(0, 6) : null, opp: opportunity(q) };
}

// The type of question missed most often, and who AI picked there instead.
function biggestOpportunity(qs) {
  const missed = qs.filter((q) => !hit(q) && q.category);
  if (!missed.length) return null;
  const by = new Map();
  for (const q of missed) by.set(q.category, [...(by.get(q.category) || []), q]);
  const [category, list] = [...by.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  const total = qs.filter((q) => q.category === category).length;
  const tally = new Map();
  for (const q of list) for (const p of q.picks || []) if (p !== "@self") tally.set(p, (tally.get(p) || 0) + 1);
  const winner = [...tally.entries()].sort((a, b) => b[1] - a[1])[0] || null;
  return { category, missed: list.length, total, winner: winner ? { name: winner[0], count: winner[1] } : null };
}

// "Your next 3 steps": short titles and how long each takes, pointing at the fixes list.
function nextSteps(report) {
  const fixes = report.fixes || [];
  const det = report.fixDetails || [];
  const idx = Array.isArray(report.nextSteps) && report.nextSteps.length ? report.nextSteps : fixes.map((_, i) => i).slice(0, 3);
  return idx
    .filter((i) => fixes[i])
    .slice(0, 3)
    .map((i) => ({ fix: i, short: det[i]?.short || shorten(fixes[i], 9), effort: det[i]?.effort || "" }));
}

// Adds up "10 minutes", "1 hour" and so on. Null if any step can't be timed.
function totalTime(steps) {
  let mins = 0;
  for (const s of steps) {
    const m = String(s.effort).toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(minute|min|hour|hr)/);
    if (!m) return null;
    mins += Number(m[1]) * (m[2].startsWith("h") ? 60 : 1);
  }
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const r = Math.round(mins % 60);
  return [h ? `${h} hour${h > 1 ? "s" : ""}` : "", r ? `${r} minutes` : ""].filter(Boolean).join(" ");
}

export function publicView(report, { full = false } = {}) {
  const qs = report.questions || [];
  const checked = report.checked || qs.length;
  const found = typeof report.found === "number" ? report.found : qs.filter(hit).length;
  const points = buildPoints(report);
  const stats = buildStats(report);
  const fixes = report.fixes || [];
  const fixDetails = report.fixDetails || [];
  const steps = nextSteps(report);

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
    subject: report.subject === "them" ? "them" : "you",
    customs: report.customs || [],
    topPicks: report.topPicks ?? 0,
    h2h: publicH2H(report.h2h, full),
    explorer: qs.some((q) => Array.isArray(q.picks)),
  };
  const comps = report.competitors || [];

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
      fixDetails: fixDetails.slice(0, FREE),
      // Only the first next step is shown free; the other two are counted (and blurred).
      next: steps.slice(0, 1),
      searchPreview: qs.slice(0, FREE).map(searchRow),
      // Bar lengths only: the names are in the full report.
      mapCounts: comps.slice(0, 4).map((c) => c.count),
      hidden: {
        searches: Math.max(0, qs.length - FREE),
        next: Math.max(0, steps.length - 1),
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
    fixDetails,
    next: steps,
    nextTotal: totalTime(steps),
    rank: report.rank || null,
    opportunity: biggestOpportunity(qs),
    youMentions: found,
    competitors: report.competitors || [],
    categories: report.categories || [],
    checks: report.checks || null,
    plan: report.plan || [],
    snippets: report.snippets || [],
    allSearches: qs.map(searchRow),
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
