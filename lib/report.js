// What visitors see. The full results stay private on the server.
//  - Everyone gets the score, label, visibility % and a short explanation.
//  - The detailed parts (example searches, competitors, fixes) are only sent when
//    `full` is true (the owner). Locked views get counts only, so the blurred
//    section can't be "un-blurred" in the browser.
//  - The number of searches run is never revealed.
export function publicView(report, { full = false } = {}) {
  const qs = report.questions || [];
  const hits = qs.filter((q) => Object.values(q.results || {}).some((v) => v === true));
  const missed = qs.filter((q) => !hits.includes(q));
  const examples = [...hits.slice(0, 2), ...missed].slice(0, 3);

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
    previous: report.previous || null,
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
      teaser: {
        fixes: (report.fixes || []).length,
        competitors: (report.competitors || []).length,
      },
    };
  }

  return {
    ...base,
    locked: false,
    examples,
    competitors: report.competitors || [],
    fixes: report.fixes || [],
  };
}
