// What visitors see. The full results stay private on the server: only 3 example
// searches are shown, and the number of searches run is never revealed.
export function publicView(report) {
  const qs = report.questions || [];
  const found = qs.filter((q) => Object.values(q.results || {}).some((v) => v === true));
  const missed = qs.filter((q) => !found.includes(q));
  // Show any searches where they appeared first, then fill with ones they missed.
  const examples = [...found.slice(0, 2), ...missed].slice(0, 3);

  const { questions, found: f, checked, ...rest } = report;
  return {
    ...rest,
    ais: (report.ais || []).map((a) => ({
      id: a.id,
      name: a.name,
      pct: a.checked ? Math.round((a.found / a.checked) * 100) : 0,
    })),
    examples,
  };
}
