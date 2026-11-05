// What visitors see. The full results stay private on the server.
//  - Everyone gets: the score, headline numbers, up to 3 example searches (wins first),
//    a competitive map with the top 2 competitors, the top 2 categories,
//    the first product info point and the quickest win.
//  - Anything beyond that is only sent when `full` is true (the owner). Locked views
//    only get counts of what's hidden, so the blurred parts can't be "un-blurred".
//  - The number of searches run is never revealed.
const FREE = { competitors: 2, categories: 2, highlights: 1, fixes: 1 };

function firstSentence(text) {
  const m = String(text || "").match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : String(text || "")).trim();
}

const hit = (q) => Object.values(q.results || {}).some((v) => v === true);

export function publicView(report, { full = false } = {}) {
  const qs = report.questions || [];
  const wins = qs.filter(hit).sort((a, b) => (a.position || 99) - (b.position || 99));
  const missed = qs.filter((q) => !hit(q));
  const examples = [...wins.slice(0, 2), ...missed].slice(0, 3).map((q) => ({
    question: q.question,
    category: q.category || "",
    found: hit(q),
    topPick: q.position === 1,
  }));

  const competitors = report.competitors || [];
  const categories = report.categories || [];
  const fixes = report.fixes || [];
  const highlights = report.highlights || [];
  const youMentions = qs.filter(hit).length;

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
    dataScore: report.dataScore,
    previous: report.previous || null,
    topPicks: typeof report.topPicks === "number" ? report.topPicks : null,
    rank: report.rank || null,
    youMentions,
    examples,
    checks: report.checks || null,
  };

  if (!full) {
    return {
      ...base,
      locked: true,
      summary: firstSentence(report.summary),
      highlights: highlights.slice(0, FREE.highlights),
      competitors: competitors.slice(0, FREE.competitors),
      categories: categories.slice(0, FREE.categories),
      fixes: fixes.slice(0, FREE.fixes),
      plan: null,
      hidden: {
        competitors: Math.max(0, competitors.length - FREE.competitors),
        categories: Math.max(0, categories.length - FREE.categories),
        highlights: highlights.length ? Math.max(0, highlights.length - FREE.highlights) : 2,
        fixes: Math.max(0, fixes.length - FREE.fixes),
      },
    };
  }

  return {
    ...base,
    locked: false,
    summary: report.summary,
    highlights,
    competitors,
    categories,
    fixes,
    plan: report.plan || [],
    allSearches: qs.map((q) => ({ question: q.question, category: q.category || "", found: hit(q), position: q.position || null })),
    hidden: { competitors: 0, categories: 0, highlights: 0, fixes: 0 },
  };
}
