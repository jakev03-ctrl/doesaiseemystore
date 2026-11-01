// What visitors see. The full results stay private on the server.
//  - Everyone gets: the score, label, %, 3 example searches, the top 3 competitors,
//    3 product info points and the top 3 fixes.
//  - Anything beyond that is only sent when `full` is true (the owner). Locked views
//    only get counts of what's hidden, so the blurred parts can't be "un-blurred".
//  - The number of searches run is never revealed.
const FREE_ITEMS = 3;

export function publicView(report, { full = false } = {}) {
  const qs = report.questions || [];
  const hits = qs.filter((q) => Object.values(q.results || {}).some((v) => v === true));
  const missed = qs.filter((q) => !hits.includes(q));
  const examples = [...hits.slice(0, 2), ...missed].slice(0, 3);

  const competitors = report.competitors || [];
  const fixes = report.fixes || [];

  const base = {
    id: report.id,
    createdAt: report.createdAt,
    shop: report.shop,
    category: report.category,
    extra: report.extra,
    overall: report.overall,
    visibility: report.visibility,
    label: report.label,
    dataScore: report.dataScore,
    summary: report.summary,
    highlights: report.highlights || [],
    previous: report.previous || null,
    examples,
    ais: (report.ais || []).map((a) => ({
      id: a.id,
      name: a.name,
      pct: a.checked ? Math.round((a.found / a.checked) * 100) : 0,
    })),
  };

  if (!full) {
    return {
      ...base,
      locked: true,
      competitors: competitors.slice(0, FREE_ITEMS),
      fixes: fixes.slice(0, FREE_ITEMS),
      hidden: {
        competitors: Math.max(0, competitors.length - FREE_ITEMS),
        fixes: Math.max(0, fixes.length - FREE_ITEMS),
      },
    };
  }

  return { ...base, locked: false, competitors, fixes, hidden: { competitors: 0, fixes: 0 } };
}
