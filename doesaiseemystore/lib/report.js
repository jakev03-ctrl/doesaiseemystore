// What visitors see: the full results are kept privately; only 3 example searches are shown.
export function publicView(report) {
  const qs = report.questions || [];
  const found = qs.filter((q) => Object.values(q.results || {}).some((v) => v === true));
  const missed = qs.filter((q) => !found.includes(q));
  // Show any searches where they appeared first, then fill with ones they missed.
  const examples = [...found.slice(0, 2), ...missed].slice(0, 3);
  const { questions, ...rest } = report;
  return { ...rest, questionCount: qs.length, examples };
}
